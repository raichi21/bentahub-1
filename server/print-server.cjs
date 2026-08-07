/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * BentaHub Receipt Print Server
 *
 * Prints receipts to any Windows printer (inkjet, laser, thermal).
 * For thermal POS printers: uses ESC/POS raw data.
 * For regular printers: prints as plain text via Notepad/Out-Printer.
 *
 * This is a CommonJS server file. `require` is intentional here.
 *
 * Usage:   node server/print-server.cjs
 * API:
 *   POST /print        - Print receipt (accepts receipt JSON)
 *   GET  /printers     - List available printers
 *   GET  /status       - Server health check
 */

const http = require("http")
const fs = require("fs")
const path = require("path")
const { execSync, exec } = require("child_process")
const os = require("os")

// ─── CONFIG ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PRINT_SERVER_PORT || "3001", 10)
const RECEIPTS_DIR = path.join(__dirname, "receipts")
const PRINTER_NAME = process.env.PRINTER_NAME || "" // Empty = use default printer

// ─── RECEIPT TEXT BUILDER ─────────────────────────────────────────────
// Builds a plain-text receipt that prints correctly on ANY printer
function buildReceiptText(data) {
  const lines = []
  const w = 42 // max line width

  function padCenter(text) {
    const pad = Math.max(0, Math.floor((w - text.length) / 2))
    return " ".repeat(pad) + text
  }

  function line(text) {
    lines.push(text || "")
  }

  function divider(char) {
    lines.push((char || "-").repeat(w))
  }

  // ── Header ──
  line("")
  line(padCenter("BENTAHUB RETAIL"))
  line(padCenter("Main Branch, Metro Manila"))
  line(padCenter("--- Official Receipt ---"))
  line("")

  // ── Receipt Info ──
  divider("=")
  line("  Receipt No: BH-" + String(data.receiptNumber || "").padStart(6, "0"))
  line("  Date:       " + (data.date || ""))
  line("  Cashier:    " + (data.cashier || "N/A"))
  line("  Status:     " + ((data.status || "completed").toUpperCase()))
  divider("-")

  // ── Items Header ──
  line("  ITEM                  QTY    PRICE   TOTAL")
  divider("-")

  // ── Items ──
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      const name = (item.name || "").padEnd(20).slice(0, 20)
      const qty = String(item.qty || 0).padStart(4)
      const price = "P" + (item.price || 0).toFixed(2)
      const total = "P" + ((item.qty || 0) * (item.price || 0)).toFixed(2)
      line("  " + name + " " + qty + "  " + price.padStart(7) + " " + total.padStart(7))
    }
  }

  divider("-")

  // ── Totals ──
  line("  Subtotal:                     P" + (data.subtotal || 0).toFixed(2))
  if (data.discount && data.discount > 0) {
    line("  Discount:                    -P" + (data.discount || 0).toFixed(2))
  }
  divider("-")
  line("  TOTAL:                        P" + (data.total || 0).toFixed(2))
  divider("-")

  // ── Payment ──
  line("  Payment:       " + ((data.paymentMethod || "cash").toUpperCase()))
  line("  Amount Paid:                  P" + (data.amountPaid || 0).toFixed(2))
  line("  Change:                       P" + (data.change || 0).toFixed(2))
  line("")

  // ── Footer ──
  line(padCenter("Thank you for shopping with BentaHub!"))
  line(padCenter("Please keep this receipt for return/refund requests."))
  line("")
  line("")
  line("")

  return lines.join("\r\n")
}

// ─── PRINTER TRANSPORT ────────────────────────────────────────────────

function saveToFile(content, ext) {
  if (!fs.existsSync(RECEIPTS_DIR)) {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true })
  }
  const filename = "receipt_" + Date.now() + "." + ext
  const filePath = path.join(RECEIPTS_DIR, filename)
  fs.writeFileSync(filePath, content)
  return filePath
}

/**
 * Print plain text to any Windows printer.
 * Writes PowerShell to a temp .ps1 file to avoid quote-escaping issues.
 * Tries Out-Printer first, then falls back to Notepad /P.
 */
function tryPrint(text) {
  return new Promise((resolve) => {
    const tmpFile = path.join(os.tmpdir(), "bentahub_receipt_" + Date.now() + ".txt")
    const ps1File = path.join(os.tmpdir(), "bentahub_print_" + Date.now() + ".ps1")
    try {
      fs.writeFileSync(tmpFile, text, "utf8")

      // Build PowerShell script as a regular .ps1 file (NO quoting issues)
      const name = PRINTER_NAME
      const textFilePath = tmpFile

      const psScript = [
        "# BentaHub receipt printer",
        'try { $ErrorActionPreference = "Stop" } catch {}',
        "",
        "# Step 1: Find printer",
        "$printerName = " + (name ? ("'" + name + "'") : "$null"),
        "if (-not $printerName) {",
        "  $printer = Get-CimInstance -Class Win32_Printer -Filter 'Default=true' -ErrorAction SilentlyContinue",
        "  if ($printer) { $printerName = $printer.Name }",
        "}",
        "if (-not $printerName) {",
        "  Write-Output 'NO_PRINTER'",
        "  exit 0",
        "}",
        "Write-Output ('PRINTER:' + $printerName)",
        "",
        "# Step 2: Read the text content",
        "$content = Get-Content -Path '" + textFilePath + "' -Raw -ErrorAction SilentlyContinue",
        "if (-not $content) { Write-Output 'ERR: Cannot read receipt file'; exit 1 }",
        "",
        "# Step 3: Try printing with Out-Printer",
        "try {",
        "  $content | Out-Printer -Name $printerName -ErrorAction Stop",
        "  Write-Output 'PRINT_OK'",
        "  exit 0",
        "} catch {",
        "  $err1 = $_.Exception.Message",
        "}",
        "",
        "# Step 4: Fallback - print via Windows print command",
        "try {",
        "  $tempPrint = [System.IO.Path]::GetTempFileName() + '.txt'",
        "  $content | Out-File -FilePath $tempPrint -Encoding UTF8 -Force",
        "  $result = cmd.exe /c type '$tempPrint' 2>&1 | Out-Printer -Name $printerName -ErrorAction SilentlyContinue",
        "  if ($?) { Write-Output 'PRINT_OK'; Remove-Item $tempPrint -Force; exit 0 }",
        "  Remove-Item $tempPrint -Force -ErrorAction SilentlyContinue",
        "} catch {}",
        "",
        "# Step 5: Last resort - Notepad print",
        "try {",
        "  $p = Start-Process -FilePath notepad.exe -ArgumentList '/P', '" + textFilePath + "' -Wait -NoNewWindow -PassThru",
        "  if ($p.ExitCode -eq 0) { Write-Output 'PRINT_OK'; exit 0 }",
        "} catch {}",
        "",
        "# All methods failed",
        "Write-Output ('ERR: ' + $err1)",
      ].join("\n")

      fs.writeFileSync(ps1File, psScript, "utf8")

      exec(
        'powershell -NoProfile -ExecutionPolicy Bypass -File "' + ps1File + '"',
        { timeout: 30000, windowsHide: true },
        (error, stdout) => {
          try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
          try { fs.unlinkSync(ps1File) } catch { /* ignore */ }
          const output = (stdout || "").trim()
          const printerLine = output.split("\n").find(l => l.startsWith("PRINTER:"))
          const printerNameOut = printerLine ? printerLine.replace("PRINTER:", "").trim() : ""

          if (output.includes("PRINT_OK")) {
            resolve(printerNameOut + "|SUCCESS")
          } else if (output.includes("NO_PRINTER")) {
            resolve("|NO_PRINTER")
          } else {
            const errMsg = error ? error.message : output || "Unknown error"
            resolve("|ERROR:" + errMsg)
          }
        },
      )
    } catch (err) {
      try { fs.unlinkSync(tmpFile) } catch { /* ignore */ }
      try { fs.unlinkSync(ps1File) } catch { /* ignore */ }
      resolve("|ERROR:" + err.message)
    }
  })
}

function getWindowsPrinters() {
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-CimInstance -Class Win32_Printer | Select-Object Name, Default, PrinterStatus | ConvertTo-Json"',
      { timeout: 5000, windowsHide: true }
    )
    return JSON.parse(output.toString())
  } catch {
    return []
  }
}

// ─── HTTP SERVER ──────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Content-Type", "application/json")

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  const url = new URL(req.url, "http://localhost:" + PORT)

  // ── GET /status ──
  if (req.method === "GET" && url.pathname === "/status") {
    res.writeHead(200)
    res.end(JSON.stringify({ status: "ok", printerName: PRINTER_NAME || "(default)" }))
    return
  }

  // ── GET /printers ──
  if (req.method === "GET" && url.pathname === "/printers") {
    const printers = getWindowsPrinters()
    const list = Array.isArray(printers) ? printers : [printers]
    res.writeHead(200)
    res.end(JSON.stringify({ printers: list.filter(Boolean) }))
    return
  }

  // ── POST /print ──
  if (req.method === "POST" && url.pathname === "/print") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const data = JSON.parse(body)
        if (!data.items || data.items.length === 0) {
          res.writeHead(400)
          res.end(JSON.stringify({ success: false, message: "No items provided" }))
          return
        }

        // Build the receipt text
        const receiptText = buildReceiptText(data)
        const filePath = saveToFile(receiptText, "txt")

        // Try to print via Windows
        const result = await tryPrint(receiptText)
        const parts = result.split("|")
        const printerName_ = parts[0] || ""
        const printStatus = parts[1] || ""
        const printed = printStatus === "SUCCESS"

        // Build error detail message
        const errorDetail = printStatus.startsWith("ERROR")
          ? printStatus.replace("ERROR:", "")
          : ""

        res.writeHead(200)
        res.end(JSON.stringify({
          success: true,
          printed,
          printerName: printerName_,
          message: printed
            ? "Receipt sent to: " + printerName_
            : printStatus === "NO_PRINTER"
              ? "No printer found. Receipt saved to file."
              : errorDetail
                ? "Print error: " + errorDetail + ". Saving to file."
                : "Could not print. Receipt saved to file.",
          filePath: filePath.replace(__dirname, "."),
        }))
      } catch (err) {
        res.writeHead(400)
        res.end(JSON.stringify({ success: false, message: err.message }))
      }
    })
    return
  }

  // ── 404 ──
  res.writeHead(404)
  res.end(JSON.stringify({ success: false, message: "Not found" }))
})

// ─── START ────────────────────────────────────────────────────────────
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true })
}

server.listen(PORT, () => {
  console.log("\n  " + String.fromCharCode(0x1f5a8) + "  BentaHub Print Server")
  console.log("  " + String.fromCharCode(0x2500).repeat(23))
  console.log("  Server:   http://localhost:" + PORT)
  console.log("  Printer:  " + (PRINTER_NAME || "(default Windows printer)"))
  console.log("  Receipts: " + RECEIPTS_DIR + "\n")
})

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port " + PORT + " is already in use. Set PRINT_SERVER_PORT env var to use a different port.")
  } else {
    console.error("Server error:", err)
  }
  process.exit(1)
})

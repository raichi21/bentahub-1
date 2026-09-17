/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * BentaHub Receipt Print Server
 *
 * Prints receipts to any Windows printer (inkjet, laser, thermal).
 * For thermal POS printers: uses ESC/POS raw data.
 * Direct USB path talks to USB printer-class devices through the built-in
 * usbprint.sys interface (no extra driver required). Falls back to the print
 * queue, then to plain text on regular printers.
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
// Transport strategy: "auto" (direct USB -> print queue -> text), "usb" (direct
// USB only) or "queue" (print queue only, no direct USB).
const PRINT_TRANSPORT = ["auto", "usb", "queue"].includes(
  (process.env.PRINT_TRANSPORT || "").toLowerCase()
)
  ? (process.env.PRINT_TRANSPORT || "").toLowerCase()
  : "auto"
// USB vendor/product of the POS printer (for the direct USB path).
const USB_PRINTER_VID_PID = process.env.USB_PRINTER_VID_PID || "0FE6:811E"

// ─── RECEIPT TEXT BUILDER ─────────────────────────────────────────────
// Builds a plain-text receipt that prints correctly on ANY printer
function buildReceiptText(data) {
  const lines = []
  // 58mm thermal paper fits ~32 monospace chars, regular paper ~42.
  const w = data.paperWidth === "58mm" ? 32 : 42 // max line width

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
  line(padCenter(data.storeName || "BENTAHUB RETAIL"))
  line(padCenter(data.branch || "Main Branch, Metro Manila"))
  line(padCenter("--- Official Receipt ---"))
  line("")

  // ── Receipt Info ──
  divider("=")
  line("  Receipt No: BH-" + String(data.receiptNumber || "").padStart(6, "0"))
  line("  Date:       " + (data.date || ""))
  line("  Cashier:    " + (data.cashier || "N/A"))
  line("  Status:     " + (data.status || "completed").toUpperCase())
  divider("-")

  // ── Items Header ──
  if (w >= 42) {
    line("  ITEM                  QTY    PRICE   TOTAL")
  } else {
    line("  ITEM              QTY   PRICE   TOTAL")
  }
  divider("-")

  // ── Items ──
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      const name = (item.name || "").padEnd(14).slice(0, 14)
      const qty = String(item.qty || 0).padStart(3)
      const price = "P" + (item.price || 0).toFixed(2)
      const total = "P" + ((item.qty || 0) * (item.price || 0)).toFixed(2)
      if (w >= 42) {
        line(
          "  " +
            name.padEnd(20).slice(0, 20) +
            " " +
            qty +
            "  " +
            price.padStart(7) +
            " " +
            total.padStart(7)
        )
      } else {
        line(
          "  " +
            name +
            " " +
            qty +
            "  " +
            price.padStart(6) +
            " " +
            total.padStart(6)
        )
      }
    }
  }

  divider("-")

  // ── Totals ──
  if (w >= 42) {
    line("  Subtotal:                     P" + (data.subtotal || 0).toFixed(2))
    if (data.discount && data.discount > 0) {
      line(
        "  Discount:                    -P" + (data.discount || 0).toFixed(2)
      )
    }
    divider("-")
    line("  TOTAL:                        P" + (data.total || 0).toFixed(2))
    divider("-")

    // ── Payment ──
    line("  Payment:       " + (data.paymentMethod || "cash").toUpperCase())
    line(
      "  Amount Paid:                  P" + (data.amountPaid || 0).toFixed(2)
    )
    line("  Change:                       P" + (data.change || 0).toFixed(2))
  } else {
    line(
      "  SUB-TOTAL                 " +
        "P" +
        (data.subtotal || 0).toFixed(2).padStart(6)
    )
    if (data.discount && data.discount > 0) {
      line(
        "  Discount                  -P" +
          (data.discount || 0).toFixed(2).padStart(5)
      )
    }
    divider("-")
    line(
      "  TOTAL                    " +
        "P" +
        (data.total || 0).toFixed(2).padStart(6)
    )
    divider("-")

    // ── Payment ──
    line("  PAYMENT:   " + (data.paymentMethod || "cash").toUpperCase())
    line(
      "  AMOUNT PAID:        " +
        "P" +
        (data.amountPaid || 0).toFixed(2).padStart(6)
    )
    line(
      "  CHANGE:             " + "P" + (data.change || 0).toFixed(2).padStart(6)
    )
  }
  line("")

  // ── Footer ──
  const storeFooter =
    "Thank you for shopping with " + (data.storeName || "BentaHub") + "!"
  line(padCenter(storeFooter.slice(0, w)))
  line(padCenter("Please keep this receipt for refunds.".slice(0, w)))
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
function tryPrint(text, printerName) {
  return new Promise((resolve) => {
    const tmpFile = path.join(
      os.tmpdir(),
      "bentahub_receipt_" + Date.now() + ".txt"
    )
    const ps1File = path.join(
      os.tmpdir(),
      "bentahub_print_" + Date.now() + ".ps1"
    )
    try {
      fs.writeFileSync(tmpFile, text, "utf8")

      // Build PowerShell script as a regular .ps1 file (NO quoting issues)
      const name = printerName
      const textFilePath = tmpFile

      const psScript = [
        "# BentaHub receipt printer",
        'try { $ErrorActionPreference = "Stop" } catch {}',
        "",
        "# Step 1: Find printer",
        "$printerName = " +
          (name ? "'" + name.replace(/'/g, "''") + "'" : "$null"),
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
        "$content = Get-Content -Path '" +
          textFilePath +
          "' -Raw -ErrorAction SilentlyContinue",
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
        "  $p = Start-Process -FilePath notepad.exe -ArgumentList '/P', '" +
          textFilePath +
          "' -Wait -NoNewWindow -PassThru",
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
          try {
            fs.unlinkSync(tmpFile)
          } catch {
            /* ignore */
          }
          try {
            fs.unlinkSync(ps1File)
          } catch {
            /* ignore */
          }
          const output = (stdout || "").trim()
          const printerLine = output
            .split("\n")
            .find((l) => l.startsWith("PRINTER:"))
          const printerNameOut = printerLine
            ? printerLine.replace("PRINTER:", "").trim()
            : ""

          if (output.includes("PRINT_OK")) {
            resolve(printerNameOut + "|SUCCESS")
          } else if (output.includes("NO_PRINTER")) {
            resolve("|NO_PRINTER")
          } else {
            const errMsg = error ? error.message : output || "Unknown error"
            resolve("|ERROR:" + errMsg)
          }
        }
      )
    } catch (err) {
      try {
        fs.unlinkSync(tmpFile)
      } catch {
        /* ignore */
      }
      try {
        fs.unlinkSync(ps1File)
      } catch {
        /* ignore */
      }
      resolve("|ERROR:" + err.message)
    }
  })
}

/**
 * Print raw ESC/POS bytes to a Windows printer (thermal printers only).
 * Uses Winspool.drv through P/Invoke with a RAW datatype so the exact
 * 58mm layout bytes reach the device unmodified.
 */
function tryPrintRaw(escPosBase64, printerName) {
  return new Promise((resolve) => {
    const ps1File = path.join(
      os.tmpdir(),
      "bentahub_raw_" + Date.now() + ".ps1"
    )
    try {
      const name = printerName.replace(/'/g, "''")
      const psScript = [
        "# BentaHub raw ESC/POS receipt printer",
        'Add-Type -TypeDefinition @"',
        "using System;",
        "using System.Runtime.InteropServices;",
        "public static class RawPrinter {",
        "  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]",
        "  public struct DOC_INFO_1 {",
        "    public string pDocName;",
        "    public string pOutputFile;",
        "    public string pDatatype;",
        "  }",
        '  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]',
        "  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);",
        '  [DllImport("winspool.drv", SetLastError = true)]',
        "  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, IntPtr pDocInfo);",
        '  [DllImport("winspool.drv", SetLastError = true)]',
        "  public static extern bool StartPagePrinter(IntPtr hPrinter);",
        '  [DllImport("winspool.drv", SetLastError = true)]',
        "  public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);",
        '  [DllImport("winspool.drv", SetLastError = true)]',
        "  public static extern bool EndPagePrinter(IntPtr hPrinter);",
        '  [DllImport("winspool.drv", SetLastError = true)]',
        "  public static extern bool EndDocPrinter(IntPtr hPrinter);",
        '  [DllImport("winspool.drv", SetLastError = true)]',
        "  public static extern bool ClosePrinter(IntPtr hPrinter);",
        "}",
        '"@ -ErrorAction Stop',
        "",
        "$printerName = '" + name + "'",
        '$bytes = [Convert]::FromBase64String("' + escPosBase64 + '")',
        "if (-not $bytes -or $bytes.Length -eq 0) { Write-Output 'ERR: empty ESC/POS payload'; exit 1 }",
        "",
        "$hPrinter = [IntPtr]::Zero",
        "if (-not [RawPrinter]::OpenPrinter($printerName, [ref]$hPrinter, [IntPtr]::Zero)) {",
        "  Write-Output ('ERR: OpenPrinter failed (code ' + [Runtime.InteropServices.Marshal]::GetLastWin32Error() + ')'); exit 1",
        "}",
        "try {",
        "  $docInfo = New-Object 'RawPrinter+DOC_INFO_1'",
        "  $docInfo.pDocName = 'BentaHub Receipt'",
        "  $docInfo.pOutputFile = $null",
        "  $docInfo.pDatatype = 'RAW'",
        "  $ptr = [Runtime.InteropServices.Marshal]::AllocHGlobal([Runtime.InteropServices.Marshal]::SizeOf($docInfo))",
        "  [Runtime.InteropServices.Marshal]::StructureToPtr($docInfo, $ptr, $false)",
        "  if (-not [RawPrinter]::StartDocPrinter($hPrinter, 1, $ptr)) {",
        "    Write-Output ('ERR: StartDoc failed (code ' + [Runtime.InteropServices.Marshal]::GetLastWin32Error() + ')'); exit 1",
        "  }",
        "  try {",
        "    [RawPrinter]::StartPagePrinter($hPrinter) | Out-Null",
        "    $written = 0",
        "    if (-not [RawPrinter]::WritePrinter($hPrinter, $bytes, $bytes.Length, [ref]$written)) {",
        "      Write-Output ('ERR: WritePrinter failed (code ' + [Runtime.InteropServices.Marshal]::GetLastWin32Error() + ')'); exit 1",
        "    }",
        "    [RawPrinter]::EndPagePrinter($hPrinter) | Out-Null",
        "  } finally {",
        "    [RawPrinter]::EndDocPrinter($hPrinter) | Out-Null",
        "  }",
        "  Write-Output ('PRINTER:' + $printerName)",
        "  Write-Output 'PRINT_OK'",
        "} finally {",
        "  [RawPrinter]::ClosePrinter($hPrinter) | Out-Null",
        "  if ($ptr) { [Runtime.InteropServices.Marshal]::FreeHGlobal($ptr) }",
        "}",
      ].join("\n")

      fs.writeFileSync(ps1File, psScript, "utf8")

      exec(
        'powershell -NoProfile -ExecutionPolicy Bypass -File "' + ps1File + '"',
        { timeout: 30000, windowsHide: true },
        (error, stdout) => {
          try {
            fs.unlinkSync(ps1File)
          } catch {
            /* ignore */
          }
          const output = (stdout || "").trim()
          if (output.includes("PRINT_OK")) {
            const printerLine = output
              .split("\n")
              .find((l) => l.startsWith("PRINTER:"))
            resolve(
              (printerLine
                ? printerLine.replace("PRINTER:", "").trim()
                : printerName || "") + "|SUCCESS"
            )
          } else {
            const errMsg = error ? error.message : output || "Unknown error"
            resolve("|ERROR:" + errMsg)
          }
        }
      )
    } catch (err) {
      try {
        fs.unlinkSync(ps1File)
      } catch {
        /* ignore */
      }
      resolve("|ERROR:" + err.message)
    }
  })
}

/**
 * Direct raw USB printing through the Windows USBPRINT device interface.
 * Uses the generic usbprint.sys driver that is already bound to USB
 * printer-class devices, so NO extra printer driver is required. Bypasses
 * the print queue entirely.
 */
const USBPRINT_HELPER_CS = `using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public static class UsbPrint {
  [StructLayout(LayoutKind.Sequential)]
  public struct SP_DEVINFO_DATA {
    public int cbSize;
    public Guid ClassGuid;
    public int DevInst;
    public IntPtr Reserved;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct SP_DEVICE_INTERFACE_DATA {
    public int cbSize;
    public Guid InterfaceClassGuid;
    public int Flags;
    public IntPtr Reserved;
  }

  [DllImport("setupapi.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern IntPtr SetupDiGetClassDevs(ref Guid ClassGuid, IntPtr Enumerator, IntPtr hwndParent, int Flags);

  [DllImport("setupapi.dll", SetLastError = true)]
  public static extern bool SetupDiEnumDeviceInterfaces(IntPtr hDevInfo, IntPtr devInfo, ref Guid interfaceClassGuid, int memberIndex, ref SP_DEVICE_INTERFACE_DATA deviceInterfaceData);

  [DllImport("setupapi.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern bool SetupDiGetDeviceInterfaceDetail(IntPtr hDevInfo, ref SP_DEVICE_INTERFACE_DATA deviceInterfaceData, IntPtr deviceInterfaceDetailData, int deviceInterfaceDetailDataSize, out int requiredSize, IntPtr deviceInfoData);

  [DllImport("setupapi.dll", SetLastError = true)]
  public static extern bool SetupDiDestroyDeviceInfoList(IntPtr hDevInfo);

  [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern IntPtr CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);

  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool WriteFile(IntPtr hFile, byte[] lpBuffer, int nNumberOfBytesToWrite, out int lpNumberOfBytesWritten, IntPtr lpOverlapped);

  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool CloseHandle(IntPtr hObject);

  public static string[] GetPaths() {
    Guid g = new Guid("28d78fad-5a12-11d1-ae5b-0000f803a8c2");
    IntPtr h = SetupDiGetClassDevs(ref g, IntPtr.Zero, IntPtr.Zero, 0x12);
    if (h == IntPtr.Zero || h == new IntPtr(-1)) return new string[0];
    List<string> list = new List<string>();
    try {
      int i = 0;
      while (true) {
        SP_DEVICE_INTERFACE_DATA did = new SP_DEVICE_INTERFACE_DATA();
        did.cbSize = Marshal.SizeOf(typeof(SP_DEVICE_INTERFACE_DATA));
        if (!SetupDiEnumDeviceInterfaces(h, IntPtr.Zero, ref g, i, ref did)) break;
        int need = 0;
        SetupDiGetDeviceInterfaceDetail(h, ref did, IntPtr.Zero, 0, out need, IntPtr.Zero);
        if (need > 0) {
          IntPtr buf = Marshal.AllocHGlobal(need);
          try {
            Marshal.WriteInt32(buf, IntPtr.Size == 8 ? 8 : 6);
            if (SetupDiGetDeviceInterfaceDetail(h, ref did, buf, need, out need, IntPtr.Zero)) {
              // DevicePath is a WCHAR[] placed right after the 4-byte cbSize.
              string p = Marshal.PtrToStringAuto(new IntPtr(buf.ToInt64() + 4));
              if (!string.IsNullOrEmpty(p)) list.Add(p);
            }
          } finally { Marshal.FreeHGlobal(buf); }
        }
        i++;
      }
    } finally { SetupDiDestroyDeviceInfoList(h); }
    return list.ToArray();
  }

  public static bool WriteRaw(string path, byte[] data, out int written, out int err) {
    IntPtr hFile = CreateFile(path, 0x40000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
    if (hFile == new IntPtr(-1)) { written = 0; err = Marshal.GetLastWin32Error(); return false; }
    try {
      bool ok = WriteFile(hFile, data, data.Length, out written, IntPtr.Zero);
      err = ok ? 0 : Marshal.GetLastWin32Error();
      return ok;
    } finally { CloseHandle(hFile); }
  }
}`

function usbVidPidPattern() {
  const raw = String(USB_PRINTER_VID_PID || "").trim()
  if (raw.includes("VID_")) return raw
  const [vid, pid] = raw.split(":")
  return (
    "VID_" +
    (vid || "0FE6").toUpperCase() +
    "&PID_" +
    (pid || "811E").toUpperCase()
  )
}

function buildUsbScript(mode, escPosBase64) {
  const lines = [
    "$ErrorActionPreference = 'Stop'",
    'Add-Type -TypeDefinition @"',
    USBPRINT_HELPER_CS,
    '"@ -ErrorAction Stop',
    "$pattern = '" + usbVidPidPattern().replace(/'/g, "''") + "'",
    "$paths = [UsbPrint]::GetPaths()",
    "if (-not $paths -or $paths.Count -eq 0) { Write-Output 'USB_NONE'; exit 0 }",
    "$match = $paths | Where-Object { $_ -match $pattern } | Select-Object -First 1",
    "if (-not $match) { Write-Output 'USB_NONE'; exit 0 }",
  ]
  if (mode === "detect") {
    lines.push("Write-Output ('USB_FOUND:' + $match)")
  } else {
    lines.push('$bytes = [Convert]::FromBase64String("' + escPosBase64 + '")')
    lines.push(
      "if (-not $bytes -or $bytes.Length -eq 0) { Write-Output 'ERR: empty payload'; exit 1 }"
    )
    lines.push("$written = 0; $err = 0")
    lines.push(
      "$ok = [UsbPrint]::WriteRaw($match, $bytes, [ref]$written, [ref]$err)"
    )
    lines.push(
      "if ($ok) { Write-Output ('USB_OK:' + $match) } else { Write-Output ('ERR: WriteFile failed code ' + $err); exit 1 }"
    )
  }
  return lines.join("\n")
}

let usbCache = { at: 0, value: { available: false, path: "" } }

function detectUsbPrinter({ useCache = true } = {}) {
  if (useCache && Date.now() - usbCache.at < 5000) return usbCache.value
  let value = { available: false, path: "" }
  const ps1File = path.join(
    os.tmpdir(),
    "bentahub_usb_detect_" + Date.now() + ".ps1"
  )
  try {
    fs.writeFileSync(ps1File, buildUsbScript("detect"), "utf8")
    const output = execSync(
      'powershell -NoProfile -ExecutionPolicy Bypass -File "' + ps1File + '"',
      { timeout: 15000, windowsHide: true }
    )
      .toString()
      .trim()
    if (output.includes("USB_FOUND:")) {
      value = {
        available: true,
        path: output.split("USB_FOUND:")[1].trim(),
      }
    }
  } catch {
    // No USB printer-class interface found / PowerShell failed.
  } finally {
    try {
      fs.unlinkSync(ps1File)
    } catch {
      /* ignore */
    }
  }
  usbCache = { at: Date.now(), value }
  return value
}

function tryPrintRawUsb(escPosBase64) {
  return new Promise((resolve) => {
    const ps1File = path.join(
      os.tmpdir(),
      "bentahub_usb_" + Date.now() + ".ps1"
    )
    try {
      fs.writeFileSync(ps1File, buildUsbScript("print", escPosBase64), "utf8")
      exec(
        'powershell -NoProfile -ExecutionPolicy Bypass -File "' + ps1File + '"',
        { timeout: 30000, windowsHide: true },
        (error, stdout) => {
          try {
            fs.unlinkSync(ps1File)
          } catch {
            /* ignore */
          }
          const output = (stdout || "").trim()
          if (output.includes("USB_OK:")) {
            resolve("USB Direct|SUCCESS")
          } else {
            const errLine = output.split("\n").find((l) => l.startsWith("ERR:"))
            const msg = errLine
              ? errLine.replace("ERR:", "").trim()
              : output.includes("USB_NONE")
                ? "USB printer not detected"
                : error
                  ? error.message
                  : "USB print failed"
            resolve("|ERROR:" + msg)
          }
        }
      )
    } catch (err) {
      try {
        fs.unlinkSync(ps1File)
      } catch {
        /* ignore */
      }
      resolve("|ERROR:" + err.message)
    }
  })
}

function getWindowsPrinters() {
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-CimInstance -Class Win32_Printer | Select-Object Name, DriverName, Default, PrinterStatus | ConvertTo-Json"',
      { timeout: 5000, windowsHide: true }
    )
    return JSON.parse(output.toString())
  } catch {
    return []
  }
}

const THERMAL_KEYWORDS = [
  "goojprt",
  "pt-210",
  "yichip",
  "pos58",
  "pos-58",
  "110v",
  "thermal",
  "58mm",
  "80mm",
  "tsp",
  "escpos",
  "esc",
  "xprinter",
  "rongta",
  "sam4s",
  "bixolon",
]

function isThermalPrinter(name, driverName) {
  const haystack = ((name || "") + " " + (driverName || "")).toLowerCase()
  return THERMAL_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

/**
 * Pick the printer to use:
 * 1. PRINTER_NAME env var (explicit override)
 * 2. Any installed printer whose name/driver looks like a thermal POS printer
 * 3. The Windows default printer
 */
function resolvePrinterName() {
  if (PRINTER_NAME) {
    return { name: PRINTER_NAME, thermal: isThermalPrinter(PRINTER_NAME, "") }
  }
  const printers = getWindowsPrinters()
  const list = Array.isArray(printers) ? printers : [printers]
  const thermal = list.find((p) => isThermalPrinter(p.Name, p.DriverName))
  if (thermal) return { name: thermal.Name, thermal: true }
  const def = list.find((p) => p.Default)
  if (def) return { name: def.Name, thermal: false }
  return { name: "", thermal: false }
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
    const resolved = resolvePrinterName()
    const usb = detectUsbPrinter()
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: "ok",
        printerName: resolved.name || "(none)",
        thermal: resolved.thermal,
        usb: usb.available,
        transport: PRINT_TRANSPORT,
      })
    )
    return
  }

  // ── GET /printers ──
  if (req.method === "GET" && url.pathname === "/printers") {
    const printers = getWindowsPrinters()
    const list = Array.isArray(printers) ? printers : [printers]
    const resolved = resolvePrinterName()
    res.writeHead(200)
    res.end(
      JSON.stringify({
        printers: list.filter(Boolean).map((printer) => ({
          name: printer.Name,
          default: Boolean(printer.Default),
          thermal: isThermalPrinter(printer.Name, printer.DriverName),
          preferred: printer.Name === resolved.name,
        })),
      })
    )
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
          res.end(
            JSON.stringify({ success: false, message: "No items provided" })
          )
          return
        }

        // Pick the target printer (auto thermal preference) and adapt the
        // layout: 32 cols for 58mm thermal paper, 42 for regular paper.
        const printer = resolvePrinterName()
        data.paperWidth = printer.thermal ? "58mm" : "80mm"

        // Build the receipt text (used for the text path + saved file).
        const receiptText = buildReceiptText(data)
        const filePath = saveToFile(receiptText, "txt")

        // Auto transport: direct USB (no driver) → print queue raw → text.
        const isOk = (r) =>
          typeof r === "string" && r.split("|")[1] === "SUCCESS"
        const hasBytes =
          typeof data.escPosBase64 === "string" && data.escPosBase64.length > 0

        let result
        let mode = "text"
        let transport = "queue"

        if (hasBytes && PRINT_TRANSPORT !== "queue") {
          const usbResult = await tryPrintRawUsb(data.escPosBase64)
          if (isOk(usbResult)) {
            result = usbResult
            mode = "usb"
            transport = "usb-direct"
          } else if (PRINT_TRANSPORT === "usb") {
            result = usbResult
          }
        }

        if (
          !isOk(result) &&
          PRINT_TRANSPORT !== "usb" &&
          hasBytes &&
          printer.thermal &&
          printer.name
        ) {
          const queueRaw = await tryPrintRaw(data.escPosBase64, printer.name)
          if (isOk(queueRaw)) {
            result = queueRaw
            mode = "raw"
          } else if (!result) {
            result = queueRaw
          }
        }

        if (!isOk(result) && PRINT_TRANSPORT !== "usb") {
          result = await tryPrint(receiptText, printer.name)
          mode = "text"
        }

        if (!result) {
          // DIRECT USB transport but no ESC/POS bytes → plain text printer.
          result = await tryPrint(receiptText, printer.name)
          mode = "text"
        }

        const parts = result.split("|")
        const printerName_ = parts[0] || ""
        const printStatus = parts[1] || ""
        const printed = printStatus === "SUCCESS"

        // Build error detail message
        const errorDetail = printStatus.startsWith("ERROR")
          ? printStatus.replace("ERROR:", "")
          : ""

        res.writeHead(200)
        res.end(
          JSON.stringify({
            success: true,
            printed,
            printerName: printerName_,
            mode,
            transport,
            message: printed
              ? transport === "usb-direct"
                ? "Receipt printed (USB direct)"
                : "Receipt sent to: " + printerName_
              : printStatus === "NO_PRINTER"
                ? "No printer found. Connect the PT-210 via USB (no driver needed) and start the print server."
                : errorDetail
                  ? "Print error: " + errorDetail + ". Saving to file."
                  : "Could not print. Receipt saved to file.",
            filePath: filePath.replace(__dirname, "."),
          })
        )
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

// ─── CLI DEBUG ────────────────────────────────────────────────────────
if (process.argv.includes("--detect-usb")) {
  console.log(JSON.stringify(detectUsbPrinter({ useCache: false }), null, 2))
  process.exit(0)
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
    console.error(
      "Port " +
        PORT +
        " is already in use. Set PRINT_SERVER_PORT env var to use a different port."
    )
  } else {
    console.error("Server error:", err)
  }
  process.exit(1)
})

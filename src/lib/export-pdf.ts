import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { formatPHDate } from "@/lib/date"

interface ExportTableAsPdfOptions {
  title: string
  subtitle?: string
  metrics: { label: string; value: string }[]
  headers: string[]
  rows: string[][]
  filename: string
}

export function exportTableAsPdf({ title, subtitle, metrics, headers, rows, filename }: ExportTableAsPdfOptions) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(31, 41, 55)
  doc.text(title, 14, 20)

  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  const dateLine = subtitle ?? `Generated on ${formatPHDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
  doc.text(dateLine, 14, 26)

  let y = 32
  if (metrics.length > 0) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 14
    const cols = 2
    const cardW = (pageWidth - margin * 2 - 4) / cols
    doc.setFontSize(10)
    metrics.forEach((m, i) => {
      const col = i % cols
      const rowIdx = Math.floor(i / cols)
      const x = margin + col * (cardW + 4)
      const cy = y + rowIdx * 18
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(x, cy, cardW, 16, 2, 2, "F")
      doc.setTextColor(107, 114, 128)
      doc.setFont("helvetica", "bold")
      doc.text(m.label, x + 3, cy + 6)
      doc.setFontSize(13)
      doc.setTextColor(31, 41, 55)
      doc.text(m.value, x + 3, cy + 13)
    })
    y += 18 * Math.ceil(metrics.length / cols) + 6
  }

  doc.setFont("helvetica", "normal")
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [31, 41, 55], fontSize: 9, fontStyle: "bold", cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: y, left: 14, right: 14, bottom: 14 },
  })

  doc.save(filename)
}
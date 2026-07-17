import { jsPDF } from 'jspdf'
import { countByStatus, buildArrivalCurve } from './stats'
import { STATUS_COLORS } from './statusColors'
import type { EventRecord, Participant } from '../types'

const BRAND = { r: 226, g: 68, b: 92 }
const INK = { r: 23, g: 20, b: 18 }
const MUTED = { r: 107, g: 98, b: 92 }
const GRID = { r: 236, g: 225, b: 216 }

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function niceMax(value: number): number {
  if (value <= 0) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const residual = value / magnitude
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10
  return niceResidual * magnitude
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function generateReportPdf(event: EventRecord, participants: Participant[]): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const marginX = 18
  const pageWidth = 210
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text(event.name || 'Événement', marginX, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`Rapport de check-in — généré le ${new Date().toLocaleString('fr-FR')}`, marginX, y)
  y += 12

  const checkedInCount = participants.filter((p) => p.checked_in).length
  const totalCount = participants.length
  const rate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text('Statistiques', marginX, y)
  y += 8

  const stats: [string, string][] = [
    ['Présents', String(checkedInCount)],
    ['Inscrits', String(totalCount)],
    ['Taux de présence', `${rate}%`],
    ['Absents', String(totalCount - checkedInCount)],
  ]

  const colWidth = (pageWidth - marginX * 2) / 2
  stats.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = marginX + col * colWidth
    const rowY = y + row * 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(label, x, rowY)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(INK.r, INK.g, INK.b)
    doc.text(value, x, rowY + 5)
  })
  y += Math.ceil(stats.length / 2) * 10 + 8

  // Répartition par statut
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text('Répartition par statut', marginX, y)
  y += 8

  const statusCounts = countByStatus(participants)
  const maxCount = Math.max(1, ...statusCounts.map((c) => c.count))
  const barMaxWidth = 90

  statusCounts.forEach(({ status, count }) => {
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    const barWidth = Math.max((count / maxCount) * barMaxWidth, count > 0 ? 2 : 0)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(INK.r, INK.g, INK.b)
    doc.text(status, marginX, y + 4)

    const color = hexToRgb(STATUS_COLORS[status])
    doc.setFillColor(color.r, color.g, color.b)
    doc.rect(marginX + 32, y, barWidth, 5, 'F')

    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(`${count} (${pct}%)`, marginX + 32 + barMaxWidth + 4, y + 4)

    y += 9
  })
  y += 6

  // Courbe d'arrivée
  const arrivalCurve = buildArrivalCurve(participants)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text("Courbe d'arrivée", marginX, y)
  y += 8

  if (arrivalCurve.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text('Aucune présence enregistrée pour le moment.', marginX, y)
    y += 10
  } else {
    const chartHeight = 50
    const chartWidth = pageWidth - marginX * 2
    const chartBottom = y + chartHeight
    const maxValue = niceMax(arrivalCurve[arrivalCurve.length - 1].cumulative)

    const xAt = (i: number) =>
      arrivalCurve.length === 1 ? marginX : marginX + (i / (arrivalCurve.length - 1)) * chartWidth
    const yAt = (v: number) => chartBottom - (v / maxValue) * chartHeight

    doc.setDrawColor(GRID.r, GRID.g, GRID.b)
    doc.setLineWidth(0.2)
    ;[0, maxValue / 2, maxValue].forEach((tick) => {
      const ty = yAt(tick)
      doc.line(marginX, ty, marginX + chartWidth, ty)
      doc.setFontSize(8)
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
      doc.text(String(Math.round(tick)), marginX - 2, ty + 1, { align: 'right' })
    })

    doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b)
    doc.setLineWidth(0.6)
    for (let i = 0; i < arrivalCurve.length - 1; i++) {
      doc.line(xAt(i), yAt(arrivalCurve[i].cumulative), xAt(i + 1), yAt(arrivalCurve[i + 1].cumulative))
    }

    const lastIndex = arrivalCurve.length - 1
    const lastX = xAt(lastIndex)
    const lastY = yAt(arrivalCurve[lastIndex].cumulative)
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
    doc.circle(lastX, lastY, 1.2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(INK.r, INK.g, INK.b)
    doc.text(String(arrivalCurve[lastIndex].cumulative), lastX, lastY - 3, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(formatTime(arrivalCurve[0].bucketStart), marginX, chartBottom + 5)
    doc.text(formatTime(arrivalCurve[arrivalCurve.length - 1].bucketStart), marginX + chartWidth, chartBottom + 5, {
      align: 'right',
    })

    y = chartBottom + 14
  }

  // Résumé / points de contrôle
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text('Résumé', marginX, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(INK.r, INK.g, INK.b)

  if (arrivalCurve.length === 0) {
    doc.text('Aucune arrivée enregistrée.', marginX, y)
  } else {
    const first = arrivalCurve[0]
    const last = arrivalCurve[arrivalCurve.length - 1]

    let peakIndex = 0
    let peakDelta = arrivalCurve[0].cumulative
    for (let i = 1; i < arrivalCurve.length; i++) {
      const delta = arrivalCurve[i].cumulative - arrivalCurve[i - 1].cumulative
      if (delta > peakDelta) {
        peakDelta = delta
        peakIndex = i
      }
    }
    const peak = arrivalCurve[peakIndex]
    const peakEnd = new Date(peak.bucketStart.getTime() + 15 * 60 * 1000)

    doc.text(`Première arrivée : ${formatTime(first.bucketStart)}`, marginX, y)
    y += 6
    doc.text(`Dernière arrivée : ${formatTime(last.bucketStart)}`, marginX, y)
    y += 6
    doc.text(
      `Pic d'arrivées : ${formatTime(peak.bucketStart)}–${formatTime(peakEnd)} (${peakDelta} check-in${peakDelta > 1 ? 's' : ''})`,
      marginX,
      y,
    )
  }

  return doc
}

export function downloadReportPdf(event: EventRecord, participants: Participant[]): void {
  const doc = generateReportPdf(event, participants)
  doc.save(`${event.name || 'evenement'}-rapport.pdf`)
}

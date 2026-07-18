import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { buildArrivalCurve } from './stats'
import type { EventRecord, Participant } from '../types'

const BRAND = { r: 226, g: 68, b: 92 }
const INK = { r: 23, g: 20, b: 18 }
const MUTED = { r: 107, g: 98, b: 92 }

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 18
const MARGIN_TOP = 15
const MARGIN_BOTTOM = 15

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Draws a (possibly very tall) canvas across as many PDF pages as needed,
 * slicing it into page-height chunks rather than shrinking it to fit one
 * page (which would make a multi-section dashboard screenshot illegible).
 * Returns the Y position (mm) right after the last slice, on whichever page
 * it ended on.
 */
function addCanvasAcrossPages(doc: jsPDF, canvas: HTMLCanvasElement, startY: number): number {
  const imgWidthMM = PAGE_WIDTH - MARGIN_X * 2
  const pxPerMM = canvas.width / imgWidthMM

  let sourceY = 0
  let remainingPx = canvas.height
  let currentY = startY
  let firstSlice = true

  while (remainingPx > 0) {
    const availableMM = PAGE_HEIGHT - MARGIN_BOTTOM - currentY
    const availablePx = Math.max(1, Math.floor(availableMM * pxPerMM))
    const sliceHeightPx = Math.min(availablePx, remainingPx)

    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceHeightPx
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

    const sliceHeightMM = sliceHeightPx / pxPerMM

    if (!firstSlice) {
      doc.addPage()
      currentY = MARGIN_TOP
    }
    doc.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', MARGIN_X, currentY, imgWidthMM, sliceHeightMM)

    sourceY += sliceHeightPx
    remainingPx -= sliceHeightPx
    currentY += sliceHeightMM
    firstSlice = false
  }

  return currentY
}

function drawSummary(doc: jsPDF, participants: Participant[], y: number): void {
  const arrivalCurve = buildArrivalCurve(participants)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(INK.r, INK.g, INK.b)
  doc.text('Résumé', MARGIN_X, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(INK.r, INK.g, INK.b)

  if (arrivalCurve.length === 0) {
    doc.text('Aucune arrivée enregistrée.', MARGIN_X, y)
    return
  }

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

  doc.text(`Première arrivée : ${formatTime(first.bucketStart)}`, MARGIN_X, y)
  y += 6
  doc.text(`Dernière arrivée : ${formatTime(last.bucketStart)}`, MARGIN_X, y)
  y += 6
  doc.text(
    `Pic d'arrivées : ${formatTime(peak.bucketStart)}–${formatTime(peakEnd)} (${peakDelta} check-in${peakDelta > 1 ? 's' : ''})`,
    MARGIN_X,
    y,
  )
}

export async function generateReportPdf(
  reportElement: HTMLElement,
  event: EventRecord,
  participants: Participant[],
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN_TOP + 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text(event.name || 'Événement', MARGIN_X, y)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`Rapport de check-in — généré le ${new Date().toLocaleString('fr-FR')}`, MARGIN_X, y)
  y += 10

  const canvas = await html2canvas(reportElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
  y = addCanvasAcrossPages(doc, canvas, y)
  y += 10

  if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 30) {
    doc.addPage()
    y = MARGIN_TOP
  }
  drawSummary(doc, participants, y)

  return doc
}

export async function downloadReportPdf(
  reportElement: HTMLElement,
  event: EventRecord,
  participants: Participant[],
): Promise<void> {
  const doc = await generateReportPdf(reportElement, event, participants)
  doc.save(`${event.name || 'evenement'}-rapport.pdf`)
}

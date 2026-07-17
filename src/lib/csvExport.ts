import type { Participant } from '../types'

function escapeCell(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function participantsToCsv(participants: Participant[]): string {
  const header = ['Prénom', 'Nom', 'Statut', 'Taille', 'Invité', 'Présent', 'Horodatage'].join(';')

  const rows = participants.map((p) =>
    [
      p.first_name,
      p.last_name,
      p.status,
      p.tshirt_size ?? '',
      p.is_guest ? 'Oui' : 'Non',
      p.checked_in ? 'Oui' : 'Non',
      p.checked_in_at ?? '',
    ]
      .map((cell) => escapeCell(String(cell)))
      .join(';'),
  )

  return '﻿' + [header, ...rows].join('\r\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

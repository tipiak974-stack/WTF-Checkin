import * as XLSX from 'xlsx'
import type { Participant } from '../types'

export function downloadParticipantsXls(filename: string, participants: Participant[]): void {
  const rows = participants.map((p) => ({
    Nom: p.last_name,
    Prénom: p.first_name,
    Statut: p.status,
    Taille: p.tshirt_size ?? '',
    Présent: p.checked_in ? 'Oui' : 'Non',
    'Heure de check-in': p.checked_in_at
      ? new Date(p.checked_in_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants')
  XLSX.writeFile(workbook, filename)
}

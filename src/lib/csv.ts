import type { ParticipantStatus } from '../types'
import { normalize } from './strings'

export interface ParsedParticipantRow {
  first_name: string
  last_name: string
  status: ParticipantStatus
  tshirt_size: string | null
}

export interface CsvParseResult {
  rows: ParsedParticipantRow[]
  errors: string[]
}

function looksLikeHeader(cols: string[]): boolean {
  const first = normalize(cols[0] ?? '')
  return first === 'prenom' || first === 'prénom' || first === 'first_name' || first === 'firstname'
}

/**
 * Colonnes attendues : prénom;nom;statut;taille (statut/taille optionnels).
 * Une ligne d'en-tête est détectée et ignorée automatiquement. Le statut est
 * mis en correspondance (insensible accents/casse) avec les catégories de
 * l'événement ; à défaut de correspondance, retombe sur la première catégorie.
 */
export function parseParticipantsCsv(text: string, categories: ParticipantStatus[]): CsvParseResult {
  const rows: ParsedParticipantRow[] = []
  const errors: string[] = []
  const statusLookup = new Map(categories.map((status) => [normalize(status), status]))
  const defaultStatus = categories[0] ?? 'Participant'

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  lines.forEach((line, index) => {
    const cols = line.split(';').map((col) => col.trim())

    if (index === 0 && looksLikeHeader(cols)) {
      return
    }

    const [firstName, lastName, statusRaw, sizeRaw] = cols

    if (!firstName || !lastName) {
      errors.push(`Ligne ${index + 1} ignorée : prénom ou nom manquant ("${line}")`)
      return
    }

    rows.push({
      first_name: firstName,
      last_name: lastName,
      status: (statusRaw && statusLookup.get(normalize(statusRaw))) || defaultStatus,
      tshirt_size: sizeRaw ? sizeRaw : null,
    })
  })

  return { rows, errors }
}

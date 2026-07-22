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

export type RawRow = string[]

export type ColumnRole = 'first_name' | 'last_name' | 'full_name' | 'status' | 'tshirt_size' | 'ignore'

export const COLUMN_ROLE_LABELS: Record<ColumnRole, string> = {
  first_name: 'Prénom',
  last_name: 'Nom',
  full_name: 'Nom complet',
  status: 'Statut',
  tshirt_size: 'Taille',
  ignore: 'Ignorer',
}

/** Découpe un texte collé en lignes de cellules (délimiteur `;`, tel qu'avant). */
export function parseCsvText(text: string): RawRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(';').map((col) => col.trim()))
}

/**
 * Lit un classeur Excel (.xlsx/.xls) et renvoie la première feuille sous forme de lignes de
 * cellules. Import dynamique de `xlsx` (lib lourde) pour ne pas l'inclure dans le bundle
 * principal — même logique que `lib/xlsExport.ts`.
 */
export async function parseXlsxRows(data: ArrayBuffer): Promise<RawRow[]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' })
  return rows
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((row) => row.some((cell) => cell.length > 0))
}

const FIRST_NAME_KEYWORDS = ['prenom', 'prénom', 'first_name', 'firstname']
const LAST_NAME_KEYWORDS = ['nom', 'nom de famille', 'last_name', 'lastname']
const FULL_NAME_KEYWORDS = ['nom complet', 'nom et prenom', 'nom et prénom', 'fullname', 'full_name', 'name']
const STATUS_KEYWORDS = ['statut', 'categorie', 'catégorie', 'category', 'status']
const SIZE_KEYWORDS = ['taille', 'size', 'tshirt', 't-shirt']

function classifyHeaderCell(cell: string): ColumnRole {
  const value = normalize(cell)
  if (FULL_NAME_KEYWORDS.includes(value)) return 'full_name'
  if (FIRST_NAME_KEYWORDS.includes(value)) return 'first_name'
  if (LAST_NAME_KEYWORDS.includes(value)) return 'last_name'
  if (STATUS_KEYWORDS.includes(value)) return 'status'
  if (SIZE_KEYWORDS.includes(value)) return 'tshirt_size'
  return 'ignore'
}

function looksLikeHeader(cols: RawRow): boolean {
  return cols.some((cell) => classifyHeaderCell(cell) !== 'ignore')
}

/**
 * Détecte le rôle de chaque colonne à partir de la première ligne.
 * - Une ligne d'en-tête reconnue (au moins une colonne mappée) donne un mapping par mots-clés.
 *   Si "prénom" et "nom" sont tous les deux présents → format deux colonnes. Sinon, une colonne
 *   "nom-like" isolée est requalifiée en "nom complet" (une seule colonne = nom complet).
 * - Sans en-tête reconnu, retombe sur le positionnel historique (prénom;nom;statut;taille),
 *   corrigeable ensuite dans l'aperçu.
 */
export function detectColumnRoles(firstRow: RawRow): { roles: ColumnRole[]; hasHeader: boolean } {
  if (!firstRow || firstRow.length === 0) return { roles: [], hasHeader: false }

  if (looksLikeHeader(firstRow)) {
    const roles = firstRow.map(classifyHeaderCell)
    const hasFirst = roles.includes('first_name')
    const hasLast = roles.includes('last_name')
    if (!hasFirst && hasLast) {
      const idx = roles.indexOf('last_name')
      roles[idx] = 'full_name'
    }
    return { roles, hasHeader: true }
  }

  const legacyRoles: ColumnRole[] = ['first_name', 'last_name', 'status', 'tshirt_size']
  return { roles: firstRow.map((_, i) => legacyRoles[i] ?? 'ignore'), hasHeader: false }
}

/** Applique un mapping de colonnes (éventuellement corrigé par l'utilisateur) aux lignes brutes. */
export function applyColumnMapping(
  rows: RawRow[],
  roles: ColumnRole[],
  hasHeader: boolean,
  categories: ParticipantStatus[],
): CsvParseResult {
  const parsedRows: ParsedParticipantRow[] = []
  const errors: string[] = []
  const statusLookup = new Map(categories.map((status) => [normalize(status), status]))
  const defaultStatus = categories[0] ?? 'Participant'

  const firstNameIdx = roles.indexOf('first_name')
  const lastNameIdx = roles.indexOf('last_name')
  const fullNameIdx = roles.indexOf('full_name')
  const statusIdx = roles.indexOf('status')
  const sizeIdx = roles.indexOf('tshirt_size')

  const dataRows = hasHeader ? rows.slice(1) : rows

  dataRows.forEach((cols, i) => {
    let firstName = ''
    let lastName = ''

    if (fullNameIdx >= 0) {
      const full = (cols[fullNameIdx] ?? '').trim()
      const spaceIdx = full.indexOf(' ')
      if (spaceIdx === -1) {
        firstName = full
      } else {
        firstName = full.slice(0, spaceIdx).trim()
        lastName = full.slice(spaceIdx + 1).trim()
      }
    } else {
      firstName = (firstNameIdx >= 0 ? cols[firstNameIdx] : '')?.trim() ?? ''
      lastName = (lastNameIdx >= 0 ? cols[lastNameIdx] : '')?.trim() ?? ''
    }

    if (!firstName && !lastName) {
      errors.push(`Ligne ${i + (hasHeader ? 2 : 1)} ignorée : prénom et nom manquants ("${cols.join(';')}")`)
      return
    }

    const statusRaw = statusIdx >= 0 ? cols[statusIdx] : ''
    const sizeRaw = sizeIdx >= 0 ? cols[sizeIdx] : ''

    parsedRows.push({
      first_name: firstName,
      last_name: lastName,
      status: (statusRaw && statusLookup.get(normalize(statusRaw))) || defaultStatus,
      tshirt_size: sizeRaw ? sizeRaw.trim() : null,
    })
  })

  return { rows: parsedRows, errors }
}

/** Reste utilisé pour le collage direct sans passer par l'étape d'aperçu (compat rétro). */
export function parseParticipantsCsv(text: string, categories: ParticipantStatus[]): CsvParseResult {
  const rawRows = parseCsvText(text)
  const { roles, hasHeader } = detectColumnRoles(rawRows[0] ?? [])
  return applyColumnMapping(rawRows, roles, hasHeader, categories)
}

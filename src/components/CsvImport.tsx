import { useMemo, useRef, useState } from 'react'
import {
  applyColumnMapping,
  detectColumnRoles,
  parseCsvText,
  parseXlsxRows,
  COLUMN_ROLE_LABELS,
  type ColumnRole,
  type RawRow,
} from '../lib/csv'
import { importParticipants } from '../lib/participants'
import type { ParticipantStatus } from '../types'

const ROLE_OPTIONS = Object.keys(COLUMN_ROLE_LABELS) as ColumnRole[]
const PREVIEW_ROW_COUNT = 4

function isSpreadsheetFile(file: File): boolean {
  return /\.xlsx?$/i.test(file.name)
}

export function CsvImport({
  eventId,
  categories,
  onImported,
}: {
  eventId: string
  categories: ParticipantStatus[]
  onImported: () => void
}) {
  const [text, setText] = useState('')
  const [rawRows, setRawRows] = useState<RawRow[] | null>(null)
  const [roles, setRoles] = useState<ColumnRole[]>([])
  const [hasHeader, setHasHeader] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function loadRows(rows: RawRow[]) {
    if (rows.length === 0) {
      setRawRows([])
      setRoles([])
      setHasHeader(false)
      return
    }
    const detected = detectColumnRoles(rows[0])
    setRawRows(rows)
    setRoles(detected.roles)
    setHasHeader(detected.hasHeader)
  }

  function handleParseText(rawText: string) {
    setText(rawText)
    setError(null)
    if (!rawText.trim()) {
      setRawRows(null)
      return
    }
    loadRows(parseCsvText(rawText))
  }

  async function handleFileUpload(file: File) {
    setError(null)
    setText('')
    try {
      if (isSpreadsheetFile(file)) {
        const buffer = await file.arrayBuffer()
        loadRows(await parseXlsxRows(buffer))
      } else {
        const content = await file.text()
        loadRows(parseCsvText(content))
      }
    } catch {
      setError("Impossible de lire ce fichier.")
      setRawRows(null)
    }
  }

  function handleRoleChange(index: number, role: ColumnRole) {
    setRoles((prev) => prev.map((r, i) => (i === index ? role : r)))
  }

  const preview = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return null
    return applyColumnMapping(rawRows, roles, hasHeader, categories)
  }, [rawRows, roles, hasHeader, categories])

  const previewDataRows = useMemo(() => {
    if (!rawRows) return []
    const dataRows = hasHeader ? rawRows.slice(1) : rawRows
    return dataRows.slice(0, PREVIEW_ROW_COUNT)
  }, [rawRows, hasHeader])

  function resetAll() {
    setText('')
    setRawRows(null)
    setRoles([])
    setHasHeader(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleImport() {
    if (!preview || preview.rows.length === 0) return
    setImporting(true)
    try {
      await importParticipants(eventId, preview.rows)
      resetAll()
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setImporting(false)
    }
  }

  const example = categories[0] ?? 'Participant'
  const columnCount = rawRows?.[0]?.length ?? 0

  return (
    <div className="rounded-2xl border-2 border-line bg-surface p-4">
      <h2 className="font-sans text-xl text-brand-600">Import CSV / Excel</h2>
      <p className="mt-1 text-sm text-ink-600">
        Colle du texte (prénom;nom;statut;taille) ou uploade un fichier .csv/.xlsx — le mapping des colonnes se règle
        ci-dessous avant import.
      </p>

      <textarea
        value={text}
        onChange={(e) => handleParseText(e.target.value)}
        placeholder={`Jean;Dupont;${example};M\nMarie;Martin;${example};S`}
        rows={5}
        className="mt-3 w-full rounded-xl border-2 border-line bg-paper px-3 py-2 text-base font-mono text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
      />

      <div className="mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
          className="text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>

      {error && <p className="mt-3 text-sm text-brand-700">{error}</p>}

      {rawRows && rawRows.length === 0 && <p className="mt-3 text-sm text-brand-700">Fichier vide.</p>}

      {rawRows && rawRows.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink-900">Aperçu et mapping des colonnes</p>
          <div className="mt-2 overflow-x-auto rounded-xl border-2 border-line">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b-2 border-line bg-paper">
                  {Array.from({ length: columnCount }).map((_, colIndex) => (
                    <th key={colIndex} className="p-2 text-left align-top">
                      <select
                        value={roles[colIndex] ?? 'ignore'}
                        onChange={(e) => handleRoleChange(colIndex, e.target.value as ColumnRole)}
                        className="w-full rounded-lg border-2 border-line bg-surface px-2 py-1.5 text-xs font-semibold text-ink-900 focus:border-brand-500 focus:outline-none"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {COLUMN_ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      {hasHeader && (
                        <p className="mt-1 truncate text-xs text-ink-400">{rawRows[0][colIndex]}</p>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {previewDataRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: columnCount }).map((_, colIndex) => (
                      <td key={colIndex} className="p-2 text-ink-700">
                        {row[colIndex] || <span className="text-ink-400">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview && (
            <div className="mt-3 rounded-xl bg-paper p-3 text-sm">
              <p>
                <span className="font-semibold text-brand-600">{preview.rows.length}</span> participant(s) prêt(s) à
                importer
              </p>
              {preview.errors.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-brand-700">
                  {preview.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!preview || preview.rows.length === 0 || importing}
        className="mt-3 w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
      >
        {importing ? 'Import…' : 'Importer'}
      </button>
    </div>
  )
}

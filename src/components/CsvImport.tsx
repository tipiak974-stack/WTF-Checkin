import { useRef, useState } from 'react'
import { parseParticipantsCsv, type ParsedParticipantRow } from '../lib/csv'
import { importParticipants } from '../lib/participants'

export function CsvImport({ eventId, onImported }: { eventId: string; onImported: () => void }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<{ rows: ParsedParticipantRow[]; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleParse(rawText: string) {
    setText(rawText)
    setPreview(rawText.trim() ? parseParticipantsCsv(rawText) : null)
  }

  async function handleFileUpload(file: File) {
    const content = await file.text()
    handleParse(content)
  }

  async function handleImport() {
    if (!preview || preview.rows.length === 0) return
    setImporting(true)
    try {
      await importParticipants(eventId, preview.rows)
      setText('')
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onImported()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-line bg-surface p-4">
      <h2 className="font-display text-xl text-brand-600">Import CSV</h2>
      <p className="mt-1 text-sm text-ink-600">Colonnes : prénom;nom;statut;taille (statut/taille optionnels)</p>

      <textarea
        value={text}
        onChange={(e) => handleParse(e.target.value)}
        placeholder={'Jean;Dupont;VIP;M\nMarie;Martin;Participant;S'}
        rows={5}
        className="mt-3 w-full rounded-xl border-2 border-line bg-paper px-3 py-2 text-sm font-mono text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
      />

      <div className="mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
          className="text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
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

      <button
        onClick={handleImport}
        disabled={!preview || preview.rows.length === 0 || importing}
        className="mt-3 rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {importing ? 'Import…' : 'Importer'}
      </button>
    </div>
  )
}

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
    <div className="rounded-xl border border-neutral-800 p-4">
      <h2 className="font-medium">Import CSV</h2>
      <p className="mt-1 text-sm text-neutral-400">Colonnes : prénom;nom;statut;taille (statut/taille optionnels)</p>

      <textarea
        value={text}
        onChange={(e) => handleParse(e.target.value)}
        placeholder={'Jean;Dupont;VIP;M\nMarie;Martin;Participant;S'}
        rows={5}
        className="mt-3 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-mono placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
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
          className="text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-100 hover:file:bg-neutral-700"
        />
      </div>

      {preview && (
        <div className="mt-3 rounded-lg bg-neutral-900 p-3 text-sm">
          <p>
            <span className="font-medium text-emerald-400">{preview.rows.length}</span> participant(s) prêt(s) à
            importer
          </p>
          {preview.errors.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-red-400">
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
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-50 hover:bg-emerald-500 disabled:opacity-50"
      >
        {importing ? 'Import…' : 'Importer'}
      </button>
    </div>
  )
}

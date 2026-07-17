import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent, updateEvent, uploadEventLogo } from '../lib/events'
import { addParticipant, deleteParticipant, listParticipants } from '../lib/participants'
import { CsvImport } from '../components/CsvImport'
import { EventLogo } from '../components/EventLogo'
import { ParticipantForm } from '../components/ParticipantForm'
import { StatusBadge } from '../components/StatusBadge'
import { SizeBadge } from '../components/SizeBadge'
import type { EventRecord, Participant } from '../types'

export function EventConfigPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [name, setName] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshParticipants = useCallback(() => {
    if (!eventId) return
    listParticipants(eventId).then(setParticipants).catch((err) => setError(err.message))
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    Promise.all([getEvent(eventId), listParticipants(eventId)])
      .then(([eventData, participantsData]) => {
        setEvent(eventData)
        setName(eventData.name)
        setParticipants(participantsData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  async function handleNameBlur() {
    if (!eventId || !event || name.trim() === event.name || !name.trim()) return
    try {
      await updateEvent(eventId, { name: name.trim() })
      setEvent({ ...event, name: name.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  async function handleLogoChange(file: File) {
    if (!eventId || !event) return
    setUploadingLogo(true)
    try {
      const logoUrl = await uploadEventLogo(eventId, file)
      await updateEvent(eventId, { logo_url: logoUrl })
      setEvent({ ...event, logo_url: logoUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleDelete(participantId: string) {
    try {
      await deleteParticipant(participantId)
      setParticipants((prev) => prev.filter((p) => p.id !== participantId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
        <p className="text-neutral-400">Chargement…</p>
      </main>
    )
  }

  if (!event || !eventId) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
        <p className="text-red-400">Événement introuvable.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Retour
        </Link>

        {error && <p className="mt-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-4 flex items-center gap-4">
          <label className="cursor-pointer">
            <EventLogo src={event.logo_url} alt={event.name} className="h-16 w-16 rounded-lg object-cover" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoChange(file)
              }}
            />
          </label>
          <div className="flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold tracking-tight hover:border-neutral-800 focus:border-neutral-600 focus:bg-neutral-900 focus:outline-none"
            />
            <p className="px-2 text-xs text-neutral-500">
              {uploadingLogo ? 'Envoi du logo…' : 'Clique sur le logo pour le changer'}
            </p>
          </div>
          <Link
            to={`/events/${eventId}/pointage`}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white"
          >
            Pointage
          </Link>
        </div>

        <div className="mt-8 space-y-6">
          <CsvImport eventId={eventId} onImported={refreshParticipants} />

          <div className="rounded-xl border border-neutral-800 p-4">
            <h2 className="font-medium">Ajouter un participant</h2>
            <div className="mt-3">
              <ParticipantForm
                submitLabel="Ajouter"
                submitting={adding}
                onSubmit={async (values) => {
                  setAdding(true)
                  try {
                    const participant = await addParticipant(eventId, values)
                    setParticipants((prev) => [...prev, participant].sort((a, b) => a.last_name.localeCompare(b.last_name)))
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Erreur inconnue')
                  } finally {
                    setAdding(false)
                  }
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-800 p-4">
              <h2 className="font-medium">Participants</h2>
              <span className="text-sm text-neutral-400">{participants.length}</span>
            </div>
            {participants.length === 0 ? (
              <p className="p-4 text-sm text-neutral-400">Aucun participant pour l'instant.</p>
            ) : (
              <ul className="divide-y divide-neutral-800">
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {p.first_name} {p.last_name}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                    <SizeBadge size={p.tshirt_size} />
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg px-2 py-1 text-sm text-red-400 hover:bg-red-950"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

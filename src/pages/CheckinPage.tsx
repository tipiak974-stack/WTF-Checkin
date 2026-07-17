import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '../lib/events'
import { addParticipant, listParticipants, setCheckedIn, subscribeToParticipants } from '../lib/participants'
import { normalize } from '../lib/strings'
import { EventLogo } from '../components/EventLogo'
import { ParticipantForm } from '../components/ParticipantForm'
import { StatusBadge } from '../components/StatusBadge'
import { SizeBadge } from '../components/SizeBadge'
import type { EventRecord, Participant } from '../types'

export function CheckinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return

    Promise.all([getEvent(eventId), listParticipants(eventId)])
      .then(([eventData, participantsData]) => {
        setEvent(eventData)
        setParticipants(participantsData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    return subscribeToParticipants(eventId, () => {
      listParticipants(eventId).then(setParticipants).catch(() => {})
    })
  }, [eventId])

  const results = useMemo(() => {
    const q = normalize(query)
    if (q.length < 3) return []
    return participants.filter((p) => normalize(p.last_name).includes(q))
  }, [participants, query])

  const checkedInCount = participants.filter((p) => p.checked_in).length

  async function handleToggle(participant: Participant) {
    const next = !participant.checked_in
    setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, checked_in: next } : p)))
    try {
      await setCheckedIn(participant.id, next)
    } catch (err) {
      setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, checked_in: !next } : p)))
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
    <main className="min-h-screen bg-neutral-950 pb-24 text-neutral-100">
      <div className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to={`/events/${eventId}`}>
            <EventLogo src={event.logo_url} alt={event.name} className="h-9 w-9 rounded-lg object-cover" />
          </Link>
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight">{event.name}</p>
            <p className="text-xs text-neutral-400">
              {checkedInCount} / {participants.length} présent(s)
            </p>
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom (3 caractères min)"
          className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-base placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
      </div>

      <div className="px-4 py-4">
        {error && <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        {query.trim().length < 3 ? (
          <p className="text-center text-sm text-neutral-500">Tape au moins 3 caractères du nom de famille.</p>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">Aucun participant trouvé.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.first_name} {p.last_name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <StatusBadge status={p.status} />
                    <SizeBadge size={p.tshirt_size} />
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(p)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                    p.checked_in
                      ? 'bg-emerald-600 text-emerald-50 hover:bg-emerald-500'
                      : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  {p.checked_in ? 'Présent ✓' : 'Marquer présent'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-800 bg-neutral-950 p-4">
        <button
          onClick={() => setShowGuestForm(true)}
          className="w-full rounded-xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-950 hover:bg-white"
        >
          +1 / Ajouter un invité
        </button>
      </div>

      {showGuestForm && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-neutral-900 p-4 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Ajouter un invité</h2>
              <button onClick={() => setShowGuestForm(false)} className="text-neutral-400 hover:text-neutral-200">
                ✕
              </button>
            </div>
            <div className="mt-3">
              <ParticipantForm
                submitLabel="Ajouter et marquer présent"
                submitting={addingGuest}
                onSubmit={async (values) => {
                  setAddingGuest(true)
                  try {
                    const guest = await addParticipant(eventId, {
                      ...values,
                      is_guest: true,
                      checked_in: true,
                    })
                    setParticipants((prev) => [...prev, guest])
                    setShowGuestForm(false)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Erreur inconnue')
                  } finally {
                    setAddingGuest(false)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

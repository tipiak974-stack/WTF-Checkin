import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEvent } from '../lib/events'
import { addParticipant, listParticipants, setCheckedIn, subscribeToParticipants } from '../lib/participants'
import { formatFullName, normalize } from '../lib/strings'
import { EventLogo } from '../components/EventLogo'
import { ParticipantForm } from '../components/ParticipantForm'
import { StatusBadge } from '../components/StatusBadge'
import { SizeBadge } from '../components/SizeBadge'
import { TeamColorBadge } from '../components/TeamColorBadge'
import type { EventRecord, Participant } from '../types'

const CONFLICT_MESSAGES: Record<string, string> = {
  'Already checked by another device': 'Déjà pointé par un autre appareil — liste mise à jour.',
  'Already unchecked by another device': 'Déjà décoché par un autre appareil — liste mise à jour.',
}

export function CheckinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)
  const [confirmUncheck, setConfirmUncheck] = useState<Participant | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    return participants.filter((p) => normalize(p.first_name).includes(q) || normalize(p.last_name).includes(q))
  }, [participants, query])

  const checkedInCount = participants.filter((p) => p.checked_in).length

  async function handleToggle(participant: Participant) {
    const next = !participant.checked_in
    setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, checked_in: next } : p)))
    try {
      await setCheckedIn(participant.id, next)
    } catch (err) {
      setParticipants((prev) => prev.map((p) => (p.id === participant.id ? { ...p, checked_in: !next } : p)))
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(CONFLICT_MESSAGES[message] ?? message)
      if (message in CONFLICT_MESSAGES) {
        listParticipants(eventId!).then(setParticipants).catch(() => {})
      }
    }
  }

  function handleButtonClick(participant: Participant) {
    if (participant.checked_in) {
      setConfirmUncheck(participant)
    } else {
      handleToggle(participant)
    }
  }

  function resetSearch() {
    setQuery('')
    searchInputRef.current?.focus()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper px-4 py-8">
        <p className="text-ink-600">Chargement…</p>
      </main>
    )
  }

  if (!event || !eventId) {
    return (
      <main className="min-h-screen bg-paper px-4 py-8">
        <p className="text-brand-700">Événement introuvable.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper pb-28">
      <div className="sticky top-0 z-10 border-b-2 border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to={`/events/${eventId}`}>
            <EventLogo src={event.logo_url} alt={event.name} className="h-10 w-10 rounded-xl object-cover ring-1 ring-line" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-ink-900">{event.name}</p>
            <p className="text-xs font-medium text-ink-600">
              {checkedInCount} / {participants.length} présent(s)
            </p>
          </div>
          <button
            onClick={() => navigate(`/events/${eventId}?tab=dashboard`)}
            className="shrink-0 rounded-xl border-2 border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink-900 hover:border-brand-500"
          >
            📊 Dashboard live
          </button>
        </div>

        <div className="relative mt-3">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom (3 caractères min)"
            className="w-full rounded-xl border-2 border-line bg-surface px-4 py-3.5 pr-11 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={resetSearch}
              aria-label="Effacer la recherche"
              className="absolute inset-y-0 right-2 flex items-center px-2 text-ink-400 hover:text-ink-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <p className="mb-4 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {error}
          </p>
        )}

        {query.trim().length < 3 ? (
          <p className="mt-6 text-center text-sm text-ink-400">Tape au moins 3 caractères du nom de famille.</p>
        ) : results.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-400">Aucun participant trouvé.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-ink-900">
                    {formatFullName(p.first_name, p.last_name)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <StatusBadge status={p.status} categories={event.categories_list} />
                    <TeamColorBadge teamColor={p.team_color} colors={event.colors_list} />
                    <SizeBadge size={p.tshirt_size} />
                  </div>
                </div>
                <button
                  onClick={() => handleButtonClick(p)}
                  className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold ${
                    p.checked_in
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border-2 border-line bg-paper text-ink-900 hover:border-brand-500'
                  }`}
                >
                  {p.checked_in ? 'Présent ✓' : 'Marquer présent'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-surface p-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowGuestForm(true)}
            className="rounded-xl border border-line bg-[#F5F5F5] py-4 text-sm font-semibold text-ink-700 hover:bg-line/40"
          >
            +1 / Ajouter un invité
          </button>
          <button
            onClick={resetSearch}
            className="rounded-xl bg-brand-600 py-4 text-base font-bold text-white hover:bg-brand-700"
          >
            Suivant
          </button>
        </div>
      </div>

      {showGuestForm && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink-900/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-surface p-4 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xl text-brand-600">Ajouter un invité</h2>
              <button onClick={() => setShowGuestForm(false)} className="text-ink-400 hover:text-ink-900">
                ✕
              </button>
            </div>
            <div className="mt-3">
              <ParticipantForm
                categories={event.categories_list}
                colors={event.colors_list}
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
                    console.error('[CheckinPage] Échec de l\'ajout invité :', err)
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

      {confirmUncheck && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-4">
            <h2 className="font-sans text-xl text-brand-600">Annuler le check-in ?</h2>
            <p className="mt-2 text-sm text-ink-700">
              Annuler le check-in pour{' '}
              <strong>{formatFullName(confirmUncheck.first_name, confirmUncheck.last_name)}</strong> ?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmUncheck(null)}
                className="flex-1 rounded-xl border-2 border-line px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-paper"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleToggle(confirmUncheck)
                  setConfirmUncheck(null)
                }}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

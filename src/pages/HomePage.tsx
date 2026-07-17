import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEvent, listEvents } from '../lib/events'
import { EventLogo } from '../components/EventLogo'
import type { EventWithCount } from '../types'

export function HomePage() {
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const event = await createEvent()
      navigate(`/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-4xl text-brand-600">WTF! Check-in</h1>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Événements</h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? 'Création…' : '+ Nouvel événement'}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-ink-600">Chargement…</p>
        ) : events.length === 0 ? (
          <p className="mt-8 text-ink-600">Aucun événement pour l'instant. Crée le premier !</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-line bg-surface p-4"
              >
                <EventLogo src={event.logo_url} alt={event.name} className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-line" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-ink-900">{event.name}</p>
                  <p className="text-sm text-ink-600">{event.participant_count} participant(s)</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/events/${event.id}`}
                    className="rounded-xl border-2 border-line px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-paper"
                  >
                    Configurer
                  </Link>
                  <Link
                    to={`/events/${event.id}/pointage`}
                    className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Pointage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

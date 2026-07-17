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
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Événements</h1>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-emerald-50 hover:bg-emerald-500 disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Nouvel événement'}
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        {loading ? (
          <p className="mt-8 text-neutral-400">Chargement…</p>
        ) : events.length === 0 ? (
          <p className="mt-8 text-neutral-400">Aucun événement pour l'instant. Crée le premier !</p>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-800">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-4 py-4">
                <EventLogo src={event.logo_url} alt={event.name} />
                <div className="flex-1">
                  <p className="font-medium">{event.name}</p>
                  <p className="text-sm text-neutral-400">{event.participant_count} participant(s)</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/events/${event.id}`}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
                  >
                    Configurer
                  </Link>
                  <Link
                    to={`/events/${event.id}/pointage`}
                    className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white"
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

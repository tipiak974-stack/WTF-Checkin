import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { archiveEvent, createEvent, deleteEvent, listEvents } from '../lib/events'
import { EventLogo } from '../components/EventLogo'
import type { EventWithCount } from '../types'

const ADMIN_CODE = '12345'

// Module-level, not component state: survives HomePage unmounting when the
// user navigates away (e.g. into a new event's config page) and back — the
// unlock is meant to last the whole browser session, not just while this
// component instance happens to stay mounted. Resets on a full page reload,
// which is the right "session" boundary for a client-side-only UX gate.
let sessionAdminUnlocked = false

interface PendingAction {
  id: string
  name: string
  action: 'archive' | 'delete'
}

export function HomePage() {
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminUnlocked, setAdminUnlockedState] = useState(sessionAdminUnlocked)
  const [codeModalFor, setCodeModalFor] = useState<PendingAction | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<{ id: string; name: string } | null>(null)
  const navigate = useNavigate()

  function setAdminUnlocked(value: boolean) {
    sessionAdminUnlocked = value
    setAdminUnlockedState(value)
  }

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

  async function performArchive(id: string) {
    try {
      await archiveEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  async function performDelete(id: string) {
    try {
      await deleteEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setDeleteConfirmFor(null)
    }
  }

  function handleArchiveClick(event: EventWithCount) {
    if (adminUnlocked) {
      performArchive(event.id)
    } else {
      setCodeModalFor({ id: event.id, name: event.name, action: 'archive' })
    }
  }

  function handleDeleteClick(event: EventWithCount) {
    if (adminUnlocked) {
      setDeleteConfirmFor(event)
    } else {
      setCodeModalFor({ id: event.id, name: event.name, action: 'delete' })
    }
  }

  function handleCodeSubmit(e: FormEvent) {
    e.preventDefault()
    if (codeInput !== ADMIN_CODE) {
      setCodeError('Code incorrect.')
      return
    }
    setAdminUnlocked(true)
    setCodeError(null)
    setCodeInput('')
    const pending = codeModalFor
    setCodeModalFor(null)
    if (!pending) return
    if (pending.action === 'archive') {
      performArchive(pending.id)
    } else {
      setDeleteConfirmFor({ id: pending.id, name: pending.name })
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-sans text-4xl text-brand-600">WTF! Check-in</h1>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Événements</h2>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
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
                <EventLogo
                  src={event.logo_url}
                  alt={event.name}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-line"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-ink-900">{event.name}</p>
                  <p className="text-sm text-ink-600">{event.participant_count} participant(s)</p>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <Link
                    to={`/events/${event.id}`}
                    className="flex-1 rounded-xl border-2 border-line px-4 py-2.5 text-center text-sm font-semibold text-ink-900 hover:bg-paper sm:flex-none"
                  >
                    Configurer
                  </Link>
                  <Link
                    to={`/events/${event.id}/pointage`}
                    className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700 sm:flex-none"
                  >
                    Pointage
                  </Link>
                  <button
                    onClick={() => handleArchiveClick(event)}
                    aria-label="Archiver l'événement"
                    title="Archiver"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-line text-lg hover:bg-paper"
                  >
                    🗄️
                  </button>
                  <button
                    onClick={() => handleDeleteClick(event)}
                    aria-label="Supprimer l'événement"
                    title="Supprimer"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-line text-lg hover:bg-brand-50"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {codeModalFor && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-4">
            <h2 className="font-sans text-xl text-brand-600">Code admin requis</h2>
            <p className="mt-2 text-sm text-ink-700">
              {codeModalFor.action === 'archive' ? 'Archiver' : 'Supprimer'} « {codeModalFor.name} »
            </p>
            <form onSubmit={handleCodeSubmit} className="mt-3">
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value)
                  setCodeError(null)
                }}
                placeholder="Code"
                className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
              />
              {codeError && <p className="mt-2 text-sm text-brand-700">{codeError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCodeModalFor(null)
                    setCodeInput('')
                    setCodeError(null)
                  }}
                  className="flex-1 rounded-xl border-2 border-line px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-paper"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmFor && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-4">
            <h2 className="font-sans text-xl text-brand-600">Supprimer définitivement ?</h2>
            <p className="mt-2 text-sm text-ink-700">
              Supprimer définitivement <strong>{deleteConfirmFor.name}</strong> et tous ses participants ? Cette
              action est irréversible.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setDeleteConfirmFor(null)}
                className="flex-1 rounded-xl border-2 border-line px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-paper"
              >
                Annuler
              </button>
              <button
                onClick={() => performDelete(deleteConfirmFor.id)}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getEvent, updateEvent, uploadEventLogo } from '../lib/events'
import {
  addParticipant,
  deleteParticipant,
  listParticipants,
  subscribeToParticipants,
  updateParticipant,
} from '../lib/participants'
import { UNDEFINED_TEAM_COLOR_LABEL } from '../lib/teamColors'
import { formatFullName } from '../lib/strings'
import { CsvImport } from '../components/CsvImport'
import { EventLogo } from '../components/EventLogo'
import { ParticipantForm } from '../components/ParticipantForm'
import { StatusBadge } from '../components/StatusBadge'
import { SizeBadge } from '../components/SizeBadge'
import type { EventRecord, Participant, TeamColor } from '../types'

const DashboardTab = lazy(() => import('../components/DashboardTab'))

type Tab = 'config' | 'colors' | 'participants' | 'dashboard'

const TABS: { id: Tab; label: string }[] = [
  { id: 'config', label: 'Config' },
  { id: 'colors', label: 'Couleurs' },
  { id: 'participants', label: 'Participants' },
  { id: 'dashboard', label: 'Dashboard' },
]

export function EventConfigPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : 'config'
  const setTab = (next: Tab) => setSearchParams({ tab: next }, { replace: true })
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [name, setName] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [savingCategories, setSavingCategories] = useState(false)
  const [colors, setColors] = useState<TeamColor[]>([])
  const [savingColors, setSavingColors] = useState(false)
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
        setCategories(eventData.categories_list)
        setColors(eventData.colors_list)
        setParticipants(participantsData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    return subscribeToParticipants(eventId, refreshParticipants)
  }, [eventId, refreshParticipants])

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

  function handleCategoryChange(index: number, value: string) {
    setCategories((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  function handleRemoveCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddCategory() {
    setCategories((prev) => [...prev, ''])
  }

  async function handleSaveCategories() {
    if (!eventId || !event) return
    const cleaned = categories.map((c) => c.trim()).filter(Boolean)
    if (cleaned.length === 0) return
    setSavingCategories(true)
    try {
      await updateEvent(eventId, { categories_list: cleaned })
      setEvent({ ...event, categories_list: cleaned })
      setCategories(cleaned)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSavingCategories(false)
    }
  }

  function handleColorNameChange(index: number, value: string) {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, name: value } : c)))
  }

  function handleColorHexChange(index: number, value: string) {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, hex: value } : c)))
  }

  function handleRemoveColor(index: number) {
    setColors((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddColor() {
    setColors((prev) => [...prev, { name: '', hex: '#2a78d6' }])
  }

  async function handleSaveColors() {
    if (!eventId || !event) return
    const cleaned = colors.map((c) => ({ name: c.name.trim(), hex: c.hex })).filter((c) => c.name)
    setSavingColors(true)
    try {
      await updateEvent(eventId, { colors_list: cleaned })
      setEvent({ ...event, colors_list: cleaned })
      setColors(cleaned)
    } catch (err) {
      console.error('[EventConfigPage] Échec de sauvegarde des couleurs :', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSavingColors(false)
    }
  }

  async function handleTeamColorChange(participantId: string, teamColor: string) {
    const value = teamColor || null
    setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, team_color: value } : p)))
    try {
      await updateParticipant(participantId, { team_color: value })
    } catch (err) {
      console.error('[EventConfigPage] Échec de sauvegarde de la couleur d\'équipe :', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      refreshParticipants()
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
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-ink-600 hover:text-ink-900">
            ← Retour
          </Link>
          <Link
            to={`/events/${eventId}/pointage`}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Pointage
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <EventLogo src={event.logo_url} alt={event.name} className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-line" />
          <h1 className="truncate font-sans text-2xl text-brand-600">{event.name}</h1>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-1 rounded-xl border-2 border-line bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-paper'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'config' && (
            <div className="rounded-2xl border-2 border-line bg-surface p-4">
              <h2 className="font-sans text-xl text-brand-600">Nom et logo</h2>
              <div className="mt-4 flex items-center gap-4">
                <label className="cursor-pointer">
                  <EventLogo src={event.logo_url} alt={event.name} className="h-16 w-16 rounded-xl object-cover ring-1 ring-line" />
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
                <div className="min-w-0 flex-1">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    className="w-full rounded-xl border-2 border-line bg-paper px-3 py-3 text-lg font-semibold text-ink-900 focus:border-brand-500 focus:outline-none"
                  />
                  <p className="mt-1 px-1 text-xs text-ink-400">
                    {uploadingLogo ? 'Envoi du logo…' : 'Clique sur le logo pour le changer'}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t-2 border-line pt-6">
                <h2 className="font-sans text-xl text-brand-600">Catégories</h2>
                <div className="mt-3 space-y-2">
                  {categories.map((cat, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={cat}
                        onChange={(e) => handleCategoryChange(i, e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border-2 border-line bg-paper px-3 py-3 text-base text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleRemoveCategory(i)}
                        aria-label="Supprimer la catégorie"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-line text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={handleAddCategory}
                    className="rounded-xl border-2 border-line px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-paper"
                  >
                    + Ajouter une catégorie
                  </button>
                  <button
                    onClick={handleSaveCategories}
                    disabled={savingCategories}
                    className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:ml-auto"
                  >
                    {savingCategories ? 'Enregistrement…' : 'Enregistrer les catégories'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'colors' && (
            <div className="rounded-2xl border-2 border-line bg-surface p-4">
              <h2 className="font-sans text-xl text-brand-600">Couleurs d'équipe</h2>
              <p className="mt-1 text-sm text-ink-600">
                Utilisées pour identifier l'équipe d'un participant au pointage et dans le dashboard.
              </p>
              <div className="mt-3 space-y-2">
                {colors.map((color, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => handleColorHexChange(i, e.target.value)}
                      aria-label="Couleur"
                      className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border-2 border-line bg-paper p-1"
                    />
                    <input
                      value={color.name}
                      onChange={(e) => handleColorNameChange(i, e.target.value)}
                      placeholder="Nom de la couleur"
                      className="min-w-0 flex-1 rounded-xl border-2 border-line bg-paper px-3 py-3 text-base text-ink-900 focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleRemoveColor(i)}
                      aria-label="Supprimer la couleur"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-line text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={handleAddColor}
                  className="rounded-xl border-2 border-line px-4 py-3 text-sm font-semibold text-ink-900 hover:bg-paper"
                >
                  + Ajouter une couleur
                </button>
                <button
                  onClick={handleSaveColors}
                  disabled={savingColors}
                  className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:ml-auto"
                >
                  {savingColors ? 'Enregistrement…' : 'Enregistrer les couleurs'}
                </button>
              </div>
            </div>
          )}

          {tab === 'participants' && (
            <div className="space-y-6">
              <CsvImport eventId={eventId} categories={event.categories_list} onImported={refreshParticipants} />

              <div className="rounded-2xl border-2 border-line bg-surface p-4">
                <h2 className="font-sans text-xl text-brand-600">Ajouter un participant</h2>
                <div className="mt-3">
                  <ParticipantForm
                    categories={event.categories_list}
                    colors={event.colors_list}
                    submitLabel="Ajouter"
                    submitting={adding}
                    onSubmit={async (values) => {
                      setAdding(true)
                      try {
                        const participant = await addParticipant(eventId, values)
                        setParticipants((prev) =>
                          [...prev, participant].sort((a, b) => a.last_name.localeCompare(b.last_name)),
                        )
                      } catch (err) {
                        console.error('[EventConfigPage] Échec de l\'ajout participant :', err)
                        setError(err instanceof Error ? err.message : 'Erreur inconnue')
                      } finally {
                        setAdding(false)
                      }
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-line bg-surface">
                <div className="flex items-center justify-between border-b-2 border-line p-4">
                  <h2 className="font-sans text-xl text-brand-600">Participants</h2>
                  <span className="text-sm font-semibold text-ink-600">{participants.length}</span>
                </div>
                {participants.length === 0 ? (
                  <p className="p-4 text-sm text-ink-600">Aucun participant pour l'instant.</p>
                ) : (
                  <ul className="divide-y-2 divide-line">
                    {participants.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900">
                            {formatFullName(p.first_name, p.last_name)}
                          </p>
                        </div>
                        <StatusBadge status={p.status} categories={event.categories_list} />
                        <SizeBadge size={p.tshirt_size} />
                        <select
                          value={p.team_color ?? ''}
                          onChange={(e) => handleTeamColorChange(p.id, e.target.value)}
                          aria-label="Couleur d'équipe"
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink-700 focus:border-brand-500 focus:outline-none"
                        >
                          <option value="">{UNDEFINED_TEAM_COLOR_LABEL}</option>
                          {event.colors_list.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {tab === 'dashboard' && (
            <Suspense fallback={<p className="text-ink-600">Chargement du dashboard…</p>}>
              <DashboardTab event={event} participants={participants} />
            </Suspense>
          )}
        </div>
      </div>
    </main>
  )
}

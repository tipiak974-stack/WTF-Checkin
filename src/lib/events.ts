import { supabase } from './supabase'
import type { EventRecord, EventWithCount } from '../types'

/**
 * `colors_list` peut manquer côté Supabase si la migration 0003 n'est pas encore appliquée
 * (colonne absente → `undefined`, pas `null`, donc le défaut SQL ne suffit pas côté client).
 * Normalisé ici, au point de lecture, pour que le reste de l'app puisse toujours faire
 * `event.colors_list.map(...)` sans crasher.
 */
function normalizeEvent<T extends { colors_list?: EventRecord['colors_list'] }>(event: T): T {
  return { ...event, colors_list: event.colors_list ?? [] }
}

export async function listEvents(): Promise<EventWithCount[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, participants(count)')
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((event) => ({
    ...normalizeEvent(event),
    participant_count: event.participants?.[0]?.count ?? 0,
  }))
}

export async function createEvent(): Promise<EventRecord> {
  const { data, error } = await supabase
    .from('events')
    .insert({ name: 'Nouvel événement' })
    .select()
    .single()

  if (error) throw error
  return normalizeEvent(data)
}

export async function getEvent(eventId: string): Promise<EventRecord> {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (error) throw error
  return normalizeEvent(data)
}

export async function updateEvent(
  eventId: string,
  patch: Partial<Pick<EventRecord, 'name' | 'logo_url' | 'categories_list' | 'colors_list' | 'archived'>>,
) {
  const { error } = await supabase.from('events').update(patch).eq('id', eventId)
  if (error) throw error
}

export async function archiveEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').update({ archived: true }).eq('id', eventId)
  if (error) throw error
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) throw error
}

export async function uploadEventLogo(eventId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop() ?? 'png'
  const path = `${eventId}/logo-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('event-logos').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('event-logos').getPublicUrl(path)
  return data.publicUrl
}

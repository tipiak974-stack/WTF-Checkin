import { supabase } from './supabase'
import type { EventRecord, EventWithCount } from '../types'

export async function listEvents(): Promise<EventWithCount[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, participants(count)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((event) => ({
    ...event,
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
  return data
}

export async function getEvent(eventId: string): Promise<EventRecord> {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (error) throw error
  return data
}

export async function updateEvent(eventId: string, patch: Partial<Pick<EventRecord, 'name' | 'logo_url'>>) {
  const { error } = await supabase.from('events').update(patch).eq('id', eventId)
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

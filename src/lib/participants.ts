import { supabase } from './supabase'
import type { Participant, ParticipantStatus } from '../types'
import type { ParsedParticipantRow } from './csv'

export async function listParticipants(eventId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('event_id', eventId)
    .order('last_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export interface NewParticipantInput {
  first_name: string
  last_name: string
  status: ParticipantStatus
  tshirt_size: string | null
  team_color?: string | null
  is_guest?: boolean
  checked_in?: boolean
}

export async function addParticipant(eventId: string, input: NewParticipantInput): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .insert({
      event_id: eventId,
      first_name: input.first_name,
      last_name: input.last_name,
      status: input.status,
      tshirt_size: input.tshirt_size,
      team_color: input.team_color ?? null,
      is_guest: input.is_guest ?? false,
      checked_in: input.checked_in ?? false,
      checked_in_at: input.checked_in ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateParticipant(
  participantId: string,
  patch: { team_color: string | null },
): Promise<void> {
  const { error } = await supabase.from('participants').update(patch).eq('id', participantId)
  if (error) throw error
}

export async function importParticipants(eventId: string, rows: ParsedParticipantRow[]): Promise<void> {
  if (rows.length === 0) return

  const { error } = await supabase.from('participants').insert(
    rows.map((row) => ({
      event_id: eventId,
      first_name: row.first_name,
      last_name: row.last_name,
      status: row.status,
      tshirt_size: row.tshirt_size,
    })),
  )

  if (error) throw error
}

export async function deleteParticipant(participantId: string): Promise<void> {
  const { error } = await supabase.from('participants').delete().eq('id', participantId)
  if (error) throw error
}

export async function setCheckedIn(participantId: string, checkedIn: boolean): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
    'check-in-toggle',
    { body: { participantId, action: checkedIn ? 'check' : 'uncheck' } },
  )

  if (error) {
    const context = (error as { context?: Response }).context
    const body = context && typeof context.json === 'function' ? await context.json().catch(() => null) : null
    throw new Error(body?.error ?? error.message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }
}

export function subscribeToParticipants(eventId: string, onChange: () => void) {
  const channel = supabase
    .channel(`participants-${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${eventId}` },
      onChange,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

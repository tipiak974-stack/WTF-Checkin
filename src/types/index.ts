export type ParticipantStatus = string

export interface TeamColor {
  name: string
  hex: string
}

export interface EventRecord {
  id: string
  name: string
  logo_url: string | null
  categories_list: ParticipantStatus[]
  colors_list: TeamColor[]
  archived: boolean
  created_at: string
}

export interface EventWithCount extends EventRecord {
  participant_count: number
}

export interface Participant {
  id: string
  event_id: string
  first_name: string
  last_name: string
  status: ParticipantStatus
  tshirt_size: string | null
  team_color: string | null
  is_guest: boolean
  checked_in: boolean
  checked_in_at: string | null
  created_at: string
}

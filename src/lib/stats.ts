import { getTeamColorHex, UNDEFINED_TEAM_COLOR_LABEL } from './teamColors'
import type { Participant, ParticipantStatus, TeamColor } from '../types'

export interface StatusCount {
  status: ParticipantStatus
  count: number
}

/** Toujours dans l'ordre de `categories` — préserve l'adjacence de couleur validée. */
export function countByStatus(participants: Participant[], categories: ParticipantStatus[]): StatusCount[] {
  return categories.map((status) => ({
    status,
    count: participants.filter((p) => p.status === status).length,
  }))
}

export interface TeamColorCount {
  name: string
  hex: string
  registered: number
  present: number
}

/** Toujours dans l'ordre de `colors`, avec un bucket "Non définie" en dernier. */
export function countByTeamColor(participants: Participant[], colors: TeamColor[]): TeamColorCount[] {
  const named = colors.map((color) => {
    const matching = participants.filter((p) => p.team_color === color.name)
    return {
      name: color.name,
      hex: color.hex,
      registered: matching.length,
      present: matching.filter((p) => p.checked_in).length,
    }
  })

  const knownNames = new Set(colors.map((c) => c.name))
  const undefinedParticipants = participants.filter((p) => !p.team_color || !knownNames.has(p.team_color))

  return [
    ...named,
    {
      name: UNDEFINED_TEAM_COLOR_LABEL,
      hex: getTeamColorHex(colors, null),
      registered: undefinedParticipants.length,
      present: undefinedParticipants.filter((p) => p.checked_in).length,
    },
  ]
}

export interface ArrivalPoint {
  bucketStart: Date
  cumulative: number
}

const BUCKET_MINUTES = 15
const BUCKET_MS = BUCKET_MINUTES * 60 * 1000

/** Courbe cumulative des présences par tranche de 15 minutes. */
export function buildArrivalCurve(participants: Participant[]): ArrivalPoint[] {
  const timestamps = participants
    .filter((p) => p.checked_in && p.checked_in_at)
    .map((p) => new Date(p.checked_in_at as string).getTime())
    .sort((a, b) => a - b)

  if (timestamps.length === 0) return []

  const firstBucket = Math.floor(timestamps[0] / BUCKET_MS) * BUCKET_MS
  const lastBucket = Math.floor(timestamps[timestamps.length - 1] / BUCKET_MS) * BUCKET_MS

  const points: ArrivalPoint[] = []
  let cumulative = 0
  let tsIndex = 0

  for (let bucket = firstBucket; bucket <= lastBucket; bucket += BUCKET_MS) {
    while (tsIndex < timestamps.length && timestamps[tsIndex] < bucket + BUCKET_MS) {
      cumulative++
      tsIndex++
    }
    points.push({ bucketStart: new Date(bucket), cumulative })
  }

  return points
}

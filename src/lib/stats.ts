import { PARTICIPANT_STATUSES, type Participant, type ParticipantStatus } from '../types'

export interface StatusCount {
  status: ParticipantStatus
  count: number
}

/** Toujours dans l'ordre fixe de PARTICIPANT_STATUSES — préserve l'adjacence de couleur validée. */
export function countByStatus(participants: Participant[]): StatusCount[] {
  return PARTICIPANT_STATUSES.map((status) => ({
    status,
    count: participants.filter((p) => p.status === status).length,
  }))
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

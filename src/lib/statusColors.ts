import type { ParticipantStatus } from '../types'

/**
 * Validated categorical palette (dataviz skill, fixed 8-hue order: blue,
 * green, magenta, yellow, aqua, orange, violet, red). Passes CVD +
 * normal-vision adjacency checks as a set. Categories are now free per
 * event, so color is assigned by an entry's *position* in the event's
 * category list rather than by exact name — keep the list order stable
 * wherever it's rendered side by side (badges, dashboard) so the validated
 * adjacency holds.
 */
const CATEGORICAL_PALETTE = [
  '#2a78d6',
  '#008300',
  '#e87ba4',
  '#eda100',
  '#1baf7a',
  '#eb6834',
  '#4a3aa7',
  '#e34948',
]

const FALLBACK_COLOR = '#6b625c' // ink-600 — category no longer in the event's list

export function getCategoryColor(categories: ParticipantStatus[], category: ParticipantStatus): string {
  const index = categories.indexOf(category)
  if (index < 0) return FALLBACK_COLOR
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]
}

/** Darkened brand cyan for the arrival curve line (4.5:1 on white; raw #00D9FF is 1.7:1). */
export const ARRIVAL_LINE_COLOR = '#008299'

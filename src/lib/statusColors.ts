import type { ParticipantStatus } from '../types'

/**
 * Validated categorical palette (dataviz skill, first 5 slots of the fixed
 * 8-hue order: blue, green, magenta, yellow, aqua). Passes CVD + normal-vision
 * adjacency checks as a set — keep this status order wherever these colors
 * are rendered side by side (badges, dashboard bars) so the validated
 * adjacency holds.
 */
export const STATUS_COLORS: Record<ParticipantStatus, string> = {
  Participant: '#2a78d6',
  VIP: '#008300',
  Encadrant: '#e87ba4',
  'Big Boss': '#eda100',
  Staff: '#1baf7a',
}

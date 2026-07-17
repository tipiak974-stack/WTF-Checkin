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

/**
 * Monochrome cyan ramp for the "Typologie d'invités" donut only — a
 * deliberate choice (brand cyan look over categorical hue distinction).
 * Lightness-stepped so slices stay tellable apart, each ≥3.4:1 against a
 * white surface (the raw brand cyan #00D9FF sits at 1.7:1 — nearly
 * invisible). Legend + direct labels are mandatory wherever this is used,
 * since identity here rides on lightness, not hue.
 */
export const STATUS_CYAN_RAMP: Record<ParticipantStatus, string> = {
  Participant: '#0098b3',
  VIP: '#007e94',
  Encadrant: '#00687a',
  'Big Boss': '#005261',
  Staff: '#003d47',
}

/** Darkened brand cyan for the arrival curve line (4.5:1 on white; raw #00D9FF is 1.7:1). */
export const ARRIVAL_LINE_COLOR = '#008299'


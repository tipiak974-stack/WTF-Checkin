import type { TeamColor } from '../types'

/** Preset affiché dans l'onglet Couleurs tant qu'aucune liste n'a été enregistrée. */
export const DEFAULT_TEAM_COLORS: TeamColor[] = [
  { name: 'Bleu', hex: '#0066FF' },
  { name: 'Vert', hex: '#00AA00' },
  { name: 'Rouge', hex: '#FF0000' },
  { name: 'Jaune', hex: '#FFD700' },
  { name: 'Noir', hex: '#000000' },
  { name: 'Orange', hex: '#FF8C00' },
]

/** Couleur d'équipe non assignée ou ne correspondant plus à une entrée de la palette. */
export const UNDEFINED_TEAM_COLOR_LABEL = 'Non définie'
const FALLBACK_HEX = '#a69c93' // ink-400 — gris muted déjà utilisé dans les charts

export function getTeamColorHex(colors: TeamColor[], name: string | null): string {
  if (!name) return FALLBACK_HEX
  return colors.find((c) => c.name === name)?.hex ?? FALLBACK_HEX
}

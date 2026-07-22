import { getTeamColorHex, UNDEFINED_TEAM_COLOR_LABEL } from '../lib/teamColors'
import type { TeamColor } from '../types'

export function TeamColorBadge({ teamColor, colors }: { teamColor: string | null; colors: TeamColor[] }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-700">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: getTeamColorHex(colors, teamColor) }}
        aria-hidden="true"
      />
      {teamColor ?? UNDEFINED_TEAM_COLOR_LABEL}
    </span>
  )
}

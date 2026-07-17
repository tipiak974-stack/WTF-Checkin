import { useState } from 'react'
import { STATUS_COLORS } from '../lib/statusColors'
import type { StatusCount } from '../lib/stats'

export function StatusBarChart({ counts }: { counts: StatusCount[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const total = counts.reduce((sum, c) => sum + c.count, 0)
  const max = Math.max(1, ...counts.map((c) => c.count))

  if (total === 0) {
    return <p className="text-sm text-ink-600">Aucun participant pour l'instant.</p>
  }

  return (
    <div className="space-y-1">
      {counts.map(({ status, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const widthPct = (count / max) * 100

        return (
          <div
            key={status}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors"
            style={{ backgroundColor: hovered === status ? 'var(--color-paper)' : undefined }}
            onMouseEnter={() => setHovered(status)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(status)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
          >
            <span className="w-24 shrink-0 truncate text-sm text-ink-600">{status}</span>
            <div className="h-5 flex-1">
              <div
                className="h-5"
                style={{
                  width: `${Math.max(widthPct, count > 0 ? 2 : 0)}%`,
                  backgroundColor: STATUS_COLORS[status],
                  borderRadius: '0 4px 4px 0',
                }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-ink-900">
              {count} <span className="font-normal text-ink-400">({pct}%)</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

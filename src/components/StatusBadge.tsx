import { getCategoryColor } from '../lib/statusColors'
import type { ParticipantStatus } from '../types'

export function StatusBadge({ status, categories }: { status: ParticipantStatus; categories: ParticipantStatus[] }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-700">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: getCategoryColor(categories, status) }}
        aria-hidden="true"
      />
      {status}
    </span>
  )
}

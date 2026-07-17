import type { ParticipantStatus } from '../types'

const STYLES: Record<ParticipantStatus, string> = {
  Participant: 'bg-slate-700 text-slate-100',
  VIP: 'bg-amber-500 text-amber-950',
  Encadrant: 'bg-blue-600 text-blue-50',
  'Big Boss': 'bg-fuchsia-600 text-fuchsia-50',
  Staff: 'bg-emerald-600 text-emerald-50',
}

export function StatusBadge({ status }: { status: ParticipantStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  )
}

export function SizeBadge({ size }: { size: string | null }) {
  if (!size) return null

  return (
    <span className="inline-flex items-center rounded-full border border-line bg-ink-900/[0.03] px-2.5 py-1 text-xs font-medium text-ink-600">
      {size}
    </span>
  )
}

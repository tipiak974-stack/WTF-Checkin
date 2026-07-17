export function SizeBadge({ size }: { size: string | null }) {
  if (!size) return null

  return (
    <span className="inline-flex items-center rounded-full border border-neutral-600 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
      {size}
    </span>
  )
}

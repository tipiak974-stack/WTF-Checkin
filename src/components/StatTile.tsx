export function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-line bg-surface p-4">
      <p className="text-sm text-ink-600">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${accent ? 'text-brand-600' : 'text-ink-900'}`}>{value}</p>
    </div>
  )
}

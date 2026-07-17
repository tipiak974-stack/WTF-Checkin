import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_CYAN_RAMP } from '../lib/statusColors'
import type { StatusCount } from '../lib/stats'

export function GuestDonutChart({ counts }: { counts: StatusCount[] }) {
  const total = counts.reduce((sum, c) => sum + c.count, 0)
  const data = counts.filter((c) => c.count > 0)
  const vipCount = counts.find((c) => c.status === 'VIP')?.count ?? 0
  const staffCount = counts.find((c) => c.status === 'Staff')?.count ?? 0

  if (total === 0) {
    return <p className="text-sm text-ink-600">Aucun participant pour l'instant.</p>
  }

  return (
    <div>
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_CYAN_RAMP[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '2px solid #ece1d8' }}
              formatter={(value, name) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, name]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => <span className="text-xs text-ink-700">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 top-[40%] -translate-y-1/2 text-center">
          <p className="text-3xl font-bold text-ink-900">{total}</p>
          <p className="text-xs font-medium text-ink-600">invités</p>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-sm">
        <span className="font-semibold text-ink-900">
          +{vipCount} <span className="font-normal text-ink-600">VIP</span>
        </span>
        <span className="font-semibold text-ink-900">
          +{staffCount} <span className="font-normal text-ink-600">Staff</span>
        </span>
      </div>
    </div>
  )
}

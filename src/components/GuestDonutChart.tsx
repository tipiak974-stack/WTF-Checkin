import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const PRESENT_COLOR = '#00A8E8'
const ABSENT_COLOR = '#E0E0E0'

export function GuestDonutChart({ present, total }: { present: number; total: number }) {
  if (total === 0) {
    return <p className="text-sm text-ink-600">Aucun participant pour l'instant.</p>
  }

  const absent = total - present
  const rate = Math.round((present / total) * 100)
  const data = [
    { name: 'Présents', value: present, color: PRESENT_COLOR },
    { name: 'Absents', value: absent, color: ABSENT_COLOR },
  ]

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="65%"
            outerRadius="90%"
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '2px solid #ece1d8' }}
            formatter={(value, name) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
        <p className="text-3xl font-bold text-ink-900">
          {present}/{total}
        </p>
        <p className="text-xs font-medium text-ink-600">{rate}% présence</p>
      </div>
    </div>
  )
}

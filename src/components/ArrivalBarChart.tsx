import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ARRIVAL_LINE_COLOR } from '../lib/statusColors'
import type { ArrivalBucket } from '../lib/stats'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function ArrivalBarChart({ buckets }: { buckets: ArrivalBucket[] }) {
  if (buckets.length === 0) {
    return <p className="text-sm text-ink-600">Aucune présence enregistrée pour le moment.</p>
  }

  const data = buckets.map((b) => ({ time: formatTime(b.bucketStart), count: b.count }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#ece1d8" vertical={false} />
          <XAxis dataKey="time" stroke="#a69c93" fontSize={12} tickLine={false} axisLine={{ stroke: '#c3c2b7' }} />
          <YAxis stroke="#a69c93" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '2px solid #ece1d8' }}
            labelStyle={{ color: '#171412', fontWeight: 600 }}
            formatter={(value) => [`${value} check-in`, 'Tranche']}
          />
          <Bar dataKey="count" fill={ARRIVAL_LINE_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

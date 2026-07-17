import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ARRIVAL_LINE_COLOR } from '../lib/statusColors'
import type { ArrivalPoint } from '../lib/stats'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function ArrivalLineChart({ points }: { points: ArrivalPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-ink-600">Aucune présence enregistrée pour le moment.</p>
  }

  const data = points.map((p) => ({ time: formatTime(p.bucketStart), cumulative: p.cumulative }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#ece1d8" vertical={false} />
          <XAxis dataKey="time" stroke="#a69c93" fontSize={12} tickLine={false} axisLine={{ stroke: '#c3c2b7' }} />
          <YAxis stroke="#a69c93" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '2px solid #ece1d8' }}
            labelStyle={{ color: '#171412', fontWeight: 600 }}
            formatter={(value) => [`${value} présent(s)`, 'Cumulé']}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke={ARRIVAL_LINE_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: ARRIVAL_LINE_COLOR, stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

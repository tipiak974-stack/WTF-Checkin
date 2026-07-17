import { useRef, useState } from 'react'
import type { ArrivalPoint } from '../lib/stats'

const WIDTH = 600
const HEIGHT = 220
const PAD_LEFT = 34
const PAD_RIGHT = 12
const PAD_TOP = 20
const PAD_BOTTOM = 30
const PLOT_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM

const BRAND_LINE = '#cb3d53'

function niceMax(value: number): number {
  if (value <= 0) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const residual = value / magnitude
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10
  return niceResidual * magnitude
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function ArrivalChart({ points }: { points: ArrivalPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (points.length === 0) {
    return <p className="text-sm text-ink-600">Aucune présence enregistrée pour le moment.</p>
  }

  const maxValue = niceMax(points[points.length - 1].cumulative)
  const xAt = (i: number) => (points.length === 1 ? PAD_LEFT : PAD_LEFT + (i / (points.length - 1)) * PLOT_WIDTH)
  const yAt = (v: number) => PAD_TOP + PLOT_HEIGHT - (v / maxValue) * PLOT_HEIGHT

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.cumulative)}`).join(' ')
  const areaPath = `${linePath} L ${xAt(points.length - 1)} ${PAD_TOP + PLOT_HEIGHT} L ${xAt(0)} ${PAD_TOP + PLOT_HEIGHT} Z`

  const yTicks = [0, maxValue / 2, maxValue]
  const lastPoint = points[points.length - 1]

  function updateHover(clientX: number) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)))
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label="Courbe d'arrivée cumulée"
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="#ece1d8"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={yAt(tick)} fontSize={11} fill="#a69c93" textAnchor="end" dy={4}>
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={BRAND_LINE} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={BRAND_LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        <circle cx={xAt(points.length - 1)} cy={yAt(lastPoint.cumulative)} r={4} fill={BRAND_LINE} stroke="#ffffff" strokeWidth={2} />
        <text
          x={xAt(points.length - 1)}
          y={yAt(lastPoint.cumulative) - 10}
          fontSize={12}
          fontWeight={600}
          fill="#171412"
          textAnchor="end"
        >
          {lastPoint.cumulative}
        </text>

        <text x={PAD_LEFT} y={HEIGHT - 8} fontSize={11} fill="#a69c93" textAnchor="start">
          {formatTime(points[0].bucketStart)}
        </text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 8} fontSize={11} fill="#a69c93" textAnchor="end">
          {formatTime(lastPoint.bucketStart)}
        </text>

        {hovered && (
          <>
            <line
              x1={xAt(hoverIndex!)}
              x2={xAt(hoverIndex!)}
              y1={PAD_TOP}
              y2={PAD_TOP + PLOT_HEIGHT}
              stroke="#a69c93"
              strokeWidth={1}
            />
            <circle cx={xAt(hoverIndex!)} cy={yAt(hovered.cumulative)} r={5} fill={BRAND_LINE} stroke="#ffffff" strokeWidth={2} />
          </>
        )}

        <rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
          fill="transparent"
          onPointerMove={(e) => updateHover(e.clientX)}
          onPointerDown={(e) => updateHover(e.clientX)}
          onPointerLeave={() => setHoverIndex(null)}
          onPointerUp={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border-2 border-ink-900 bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white"
          style={{
            left: `${(xAt(hoverIndex!) / WIDTH) * 100}%`,
            transform: hoverIndex! > points.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
          }}
        >
          {formatTime(hovered.bucketStart)} — <strong>{hovered.cumulative}</strong> présent(s)
        </div>
      )}
    </div>
  )
}

import { useMemo, useRef, useState } from 'react'
import { countByStatus, countByTeamColor, buildArrivalCurve } from '../lib/stats'
import { participantsToCsv, downloadCsv } from '../lib/csvExport'
import { formatFullName, normalize } from '../lib/strings'
import { getCategoryColor } from '../lib/statusColors'
import { StatusBadge } from './StatusBadge'
import { SizeBadge } from './SizeBadge'
import { TeamColorBadge } from './TeamColorBadge'
import { StatTile } from './StatTile'
import { ArrivalLineChart } from './ArrivalLineChart'
import { GuestDonutChart } from './GuestDonutChart'
import type { EventRecord, Participant } from '../types'

export default function DashboardTab({ event, participants }: { event: EventRecord; participants: Participant[] }) {
  const [query, setQuery] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const categories = event.categories_list
  const colors = event.colors_list

  const statusCounts = useMemo(() => countByStatus(participants, categories), [participants, categories])
  const teamColorCounts = useMemo(() => countByTeamColor(participants, colors), [participants, colors])
  const arrivalCurve = useMemo(() => buildArrivalCurve(participants), [participants])
  const checkedInCount = participants.filter((p) => p.checked_in).length
  const totalCount = participants.length
  const rate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0

  const results = useMemo(() => {
    const q = normalize(query)
    if (q.length < 3) return []
    return participants.filter((p) => normalize(p.first_name).includes(q) || normalize(p.last_name).includes(q))
  }, [participants, query])

  function handleExportCsv() {
    downloadCsv(`${event.name || 'evenement'}-participants.csv`, participantsToCsv(participants))
  }

  async function handleExportPdf() {
    if (!reportRef.current) return
    setExportingPdf(true)
    try {
      const { downloadReportPdf } = await import('../lib/pdfExport')
      await downloadReportPdf(reportRef.current, event, participants)
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleExportXls() {
    const { downloadParticipantsXls } = await import('../lib/xlsExport')
    downloadParticipantsXls(`${event.name || 'evenement'}-participants.xlsx`, participants)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-line bg-surface p-4">
        <h2 className="font-sans text-xl text-brand-600">Rechercher un participant</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom de famille (3 caractères min)"
          className="mt-3 w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
        />
        {query.trim().length >= 3 && (
          <ul className="mt-3 space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-ink-600">Aucun participant trouvé.</p>
            ) : (
              results.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-line p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {formatFullName(p.first_name, p.last_name)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <StatusBadge status={p.status} categories={categories} />
                      <TeamColorBadge teamColor={p.team_color} colors={colors} />
                      <SizeBadge size={p.tshirt_size} />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${p.checked_in ? 'text-brand-600' : 'text-ink-400'}`}>
                    {p.checked_in && p.checked_in_at
                      ? new Date(p.checked_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : 'Non pointé'}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div ref={reportRef} className="space-y-6 bg-paper">
        <div className="rounded-2xl bg-[#5B4B7F] p-6 text-center">
          <h2 className="font-sans text-2xl text-white sm:text-3xl">REPORTING DES ARRIVÉES</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Présents" value={checkedInCount} accent />
          <StatTile label="Inscrits" value={totalCount} />
          <StatTile label="Taux de présence" value={`${rate}%`} accent />
          <StatTile label="Absents" value={totalCount - checkedInCount} />
        </div>

        <div className="rounded-2xl border-2 border-line bg-surface p-4">
          <h2 className="font-sans text-xl text-brand-600">Taux de présence</h2>
          <div className="mt-3">
            <GuestDonutChart present={checkedInCount} total={totalCount} />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-line bg-surface p-4">
          <h2 className="font-sans text-xl text-brand-600">Points de contrôle</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {statusCounts.map(({ status, count }) => (
              <li
                key={status}
                className="flex items-center justify-between rounded-xl border-2 border-line px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getCategoryColor(categories, status) }}
                  />
                  {status}
                </span>
                <span className="text-sm font-bold text-ink-900">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-line bg-surface p-4">
          <h2 className="font-sans text-xl text-brand-600">Répartition par couleur d'équipe</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="pb-2">Couleur</th>
                  <th className="pb-2 text-right">Inscrits</th>
                  <th className="pb-2 text-right">Présents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {teamColorCounts.map((c) => (
                  <tr key={c.name}>
                    <td className="py-2">
                      <span className="flex items-center gap-2 font-semibold text-ink-900">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold text-ink-900">{c.registered}</td>
                    <td className="py-2 text-right font-bold text-ink-900">{c.present}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-line bg-surface p-4">
          <h2 className="font-sans text-xl text-brand-600">Suivi des arrivées</h2>
          <div className="mt-4">
            <ArrivalLineChart points={arrivalCurve} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-sans text-xl text-brand-600">Télécharger le rapport</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={handleExportCsv}
            disabled={participants.length === 0}
            className="rounded-xl border-2 border-line bg-surface px-3 py-3 text-sm font-semibold text-ink-900 hover:bg-paper disabled:opacity-50"
          >
            CSV
          </button>
          <button
            onClick={handleExportPdf}
            disabled={participants.length === 0 || exportingPdf}
            className="rounded-xl bg-brand-600 px-3 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {exportingPdf ? '…' : 'PDF'}
          </button>
          <button
            onClick={handleExportXls}
            disabled={participants.length === 0}
            className="rounded-xl border-2 border-line bg-surface px-3 py-3 text-sm font-semibold text-ink-900 hover:bg-paper disabled:opacity-50"
          >
            XLS
          </button>
        </div>
      </div>
    </div>
  )
}

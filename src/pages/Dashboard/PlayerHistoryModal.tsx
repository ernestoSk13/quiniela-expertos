import { useState, useEffect } from 'react'
import type { User, Team } from '@/types'
import Avatar from '@/components/Avatar'
import { usePlayerHistory, type MatchdayHistory, type PredictionWithMatch } from '@/hooks/usePlayerHistory'

interface Props {
  player: User
  isOwnProfile: boolean
  teamsMap: Record<string, Team>
  onClose: () => void
}

function PointsChart({ history }: { history: MatchdayHistory[] }) {
  if (history.length < 2) return null
  const W = 300, H = 72, PAD = 10
  const maxPts = Math.max(...history.map(h => h.cumulativePoints), 1)
  const cx = (i: number) => PAD + (i / (history.length - 1)) * (W - PAD * 2)
  const cy = (pts: number) => H - PAD - (pts / maxPts) * (H - PAD * 2)
  const linePoints = history.map((h, i) => `${cx(i)},${cy(h.cumulativePoints)}`).join(' ')

  return (
    <div className="pt-1 pb-2">
      <p className="text-xs text-gray-500 mb-1">Evolución de puntos</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {history.map((h, i) => (
          <circle
            key={i}
            cx={cx(i)}
            cy={cy(h.cumulativePoints)}
            r={i === history.length - 1 ? 5 : 3}
            fill="var(--accent)"
            stroke="#111"
            strokeWidth="1.5"
            opacity={i === history.length - 1 ? 1 : 0.75}
          />
        ))}
      </svg>
    </div>
  )
}

function PredRow({ pwm, teamsMap }: { pwm: PredictionWithMatch; teamsMap: Record<string, Team> }) {
  const { prediction: p, match: m } = pwm
  const hFlag = teamsMap[m.homeTeamCode]?.flag ?? ''
  const aFlag = teamsMap[m.awayTeamCode]?.flag ?? ''

  let badgeClass: string
  let badgeText: string
  if (p.isExact) {
    badgeClass = 'bg-green-900/50 text-green-400'
    badgeText = '3pts'
  } else if (p.isCorrectResult) {
    badgeClass = 'bg-yellow-900/50 text-yellow-400'
    badgeText = '1pt'
  } else {
    badgeClass = 'bg-gray-800 text-gray-500'
    badgeText = '0pts'
  }

  return (
    <div className="flex items-center gap-1.5 py-2 text-xs border-b border-gray-800/40 last:border-0">
      <span className="text-gray-300 w-14 text-right shrink-0">{hFlag} {m.homeTeamCode}</span>
      <span className="font-bold text-white tabular-nums shrink-0 w-12 text-center">
        {m.homeScore} — {m.awayScore}
      </span>
      <span className="text-gray-300 w-14 shrink-0">{m.awayTeamCode} {aFlag}</span>
      <span className="text-gray-500 tabular-nums ml-auto shrink-0">
        [{p.homeScore}–{p.awayScore}]
      </span>
      <span className={`font-bold px-1.5 py-0.5 rounded shrink-0 ${badgeClass}`}>
        {badgeText}
      </span>
    </div>
  )
}

function MatchdayItem({
  mh, isOpen, onToggle, teamsMap,
}: {
  mh: MatchdayHistory
  isOpen: boolean
  onToggle: () => void
  teamsMap: Record<string, Team>
}) {
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-500 text-[10px] shrink-0">{isOpen ? '▾' : '▸'}</span>
          <span className="text-sm font-medium text-gray-200 truncate text-left">
            {mh.matchday.name}
          </span>
        </div>
        <span className={`text-xs font-bold ml-3 shrink-0 ${
          mh.pointsEarned > 0 ? 'text-[var(--accent-light)]' : 'text-gray-600'
        }`}>
          {mh.pointsEarned > 0 ? `+${mh.pointsEarned}pts` : '0pts'}
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-3 border-t border-gray-800/60">
          {mh.predictions.map(pwm => (
            <PredRow key={pwm.prediction.id} pwm={pwm} teamsMap={teamsMap} />
          ))}
        </div>
      )}
    </div>
  )
}

export function HistoryContent({ userId, teamsMap }: { userId: string; teamsMap: Record<string, Team> }) {
  const { history, loading } = usePlayerHistory(userId)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && history.length > 0) setOpenIdx(history.length - 1)
  }, [loading, history.length])

  if (loading) {
    return <div className="py-8 text-center text-gray-500 text-sm">Cargando historial...</div>
  }
  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 text-sm">
        Aún no hay partidos calificados.
      </div>
    )
  }

  return (
    <div className="mt-5">
      <PointsChart history={history} />
      <div className="mt-4 space-y-2">
        {history.map((mh, i) => (
          <MatchdayItem
            key={mh.matchday.id}
            mh={mh}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            teamsMap={teamsMap}
          />
        ))}
      </div>
    </div>
  )
}

export default function PlayerHistoryModal({ player, isOwnProfile, teamsMap, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { stats } = player

  const statItems = [
    { label: 'Puntos', value: stats.totalPoints, accent: true },
    { label: 'Exactos', value: stats.exactPredictions, accent: false },
    { label: 'Correctos', value: stats.correctPredictions, accent: false },
    { label: 'Enviados', value: stats.totalPredictions, accent: false },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl surface-card border border-gray-700 pb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar url={player.avatarUrl} name={player.displayName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{player.displayName}</p>
            {isOwnProfile && (
              <p className="text-xs text-[var(--accent-light)]">Tu historial</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 px-5">
          {statItems.map(({ label, value, accent }) => (
            <div key={label} className="bg-gray-900/60 rounded-xl px-2 py-3 text-center">
              <p className={`text-xl font-black tabular-nums ${
                accent ? 'text-[var(--accent-light)]' : 'text-white'
              }`}>
                {value}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="px-5">
          {isOwnProfile ? (
            <HistoryContent userId={player.uid} teamsMap={teamsMap} />
          ) : (
            <p className="text-center text-gray-600 text-xs mt-8">
              El historial detallado solo está disponible en tu propio perfil.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

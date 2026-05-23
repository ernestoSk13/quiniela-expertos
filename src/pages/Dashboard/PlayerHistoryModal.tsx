import { useState, useEffect } from 'react'
import type { User, Team } from '@/types'
import { usePlayerHistory, type MatchdayHistory, type PredictionWithMatch } from '@/hooks/usePlayerHistory'

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

function medalColor(position: number): string {
  return position <= 3 ? MEDAL_COLORS[position - 1] : 'rgba(255,255,255,0.15)'
}

function medalTextColor(position: number): string {
  return position <= 3 ? '#111111' : 'rgba(255,255,255,0.8)'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  player: User
  position?: number
  isOwnProfile: boolean
  teamsMap: Record<string, Team>
  onClose: () => void
}

export default function PlayerHistoryModal({ player, position, isOwnProfile, teamsMap, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { stats } = player
  const hasPosition = position !== undefined && position > 0
  const posColor = hasPosition ? medalColor(position!) : 'transparent'
  const posTextColor = hasPosition ? medalTextColor(position!) : 'white'
  const statItems = [
    { label: 'Puntos',   value: stats.totalPoints,                              accent: true  },
    { label: 'Aciertos', value: stats.exactPredictions + stats.correctPredictions, accent: false },
    { label: 'Exactos',  value: stats.exactPredictions,                         accent: false },
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

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-4 pt-3 pb-4">

          {/* Avatar card + position badge encima */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Card */}
            <div style={{
              width: 68,
              height: 88,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#1a1a1a',
              border: `2px solid ${hasPosition ? posColor : 'rgba(255,255,255,0.18)'}`,
              boxSizing: 'border-box',
            }}>
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 800 }}>
                    {getInitials(player.displayName)}
                  </span>
                </div>
              )}
            </div>

            {/* Position badge — esquina superior izquierda, encima de la card */}
            {hasPosition && (
              <div style={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: posColor,
                border: '2px solid rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              }}>
                <span style={{
                  color: posTextColor,
                  fontWeight: 900,
                  fontSize: (position ?? 0) >= 10 ? 12 : 16,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {position}
                </span>
              </div>
            )}
          </div>

          {/* Derecha: nombre + close + stats */}
          <div className="flex-1 min-w-0">
            {/* Nombre + close */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="font-bold text-white text-xl leading-tight truncate">
                {player.displayName}
              </p>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors text-base leading-none shrink-0"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Stat boxes — ancho fijo */}
            <div className="flex gap-2">
              {statItems.map(({ label, value, accent }) => (
                <div
                  key={label}
                  className="bg-gray-900/70 rounded-lg py-2 text-center"
                  style={{ width: 80 }}
                >
                  <p className="text-[10px] text-gray-500 mb-0.5 leading-none">{label}</p>
                  <p className={`font-black tabular-nums leading-none ${
                    accent ? 'text-[var(--accent-light)]' : 'text-white'
                  }`} style={{ fontSize: value >= 100 ? 16 : 20 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── History content ── */}
        <div className="px-5">
          {isOwnProfile ? (
            <HistoryContent userId={player.uid} teamsMap={teamsMap} />
          ) : (
            <p className="text-center text-gray-600 text-xs mt-4">
              El historial detallado solo está disponible en tu propio perfil.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

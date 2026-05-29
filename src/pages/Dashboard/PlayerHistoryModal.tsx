import { useState, useEffect } from 'react'
import type { User, Team, PredictionResult } from '@/types'
import { usePlayerHistory, type MatchdayHistory, type PredictionWithMatch } from '@/hooks/usePlayerHistory'

function resultLabel(r: PredictionResult | null): string {
  if (r === 'home') return 'LOCAL'
  if (r === 'draw') return 'EMPATE'
  if (r === 'away') return 'VISITANTE'
  return '—'
}

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

  const W = 300, H = 72, PAD = 12
  const maxPts = Math.max(...history.map(h => h.cumulativePoints), 1)
  const cx = (i: number) => PAD + (i / (history.length - 1)) * (W - PAD * 2)
  const cy = (pts: number) => H - PAD - (pts / maxPts) * (H - PAD * 2)
  const linePoints = history.map((h, i) => `${cx(i)},${cy(h.cumulativePoints)}`).join(' ')
  const fillPoints = `${linePoints} ${cx(history.length - 1)},${H - PAD} ${cx(0)},${H - PAD}`
  const finalPts = history[history.length - 1].cumulativePoints

  return (
    <div className="mb-1">
      {/* Title row */}
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-[9px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Evolución de puntos
        </p>
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: '1rem',
            letterSpacing: '0.06em',
            color: 'var(--accent-light)',
          }}
        >
          {finalPts}pts
        </span>
      </div>

      {/* Chart SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="phm-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[H * 0.28, H * 0.56].map((gy, i) => (
          <line
            key={i}
            x1={PAD} y1={gy} x2={W - PAD} y2={gy}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}

        {/* Gradient fill area */}
        <polygon
          points={fillPoints}
          fill="url(#phm-chart-fill)"
        />

        {/* Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />

        {/* Dots */}
        {history.map((h, i) => {
          const isLast = i === history.length - 1
          return (
            <circle
              key={i}
              cx={cx(i)}
              cy={cy(h.cumulativePoints)}
              r={isLast ? 4.5 : 2.5}
              fill="var(--accent)"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth={isLast ? 1.5 : 1}
              style={isLast ? { filter: 'drop-shadow(0 0 4px var(--accent))' } : undefined}
              opacity={isLast ? 1 : 0.72}
            />
          )
        })}
      </svg>

      {/* X-axis labels */}
      <div
        className="flex mt-0.5"
        style={{ paddingLeft: PAD, paddingRight: PAD }}
      >
        {history.map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              fontSize: '0.55rem',
              color: 'rgba(255,255,255,0.2)',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              letterSpacing: '0.05em',
              textAlign: i === 0 ? 'left' : i === history.length - 1 ? 'right' : 'center',
            }}
          >
            J{i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

function PredRow({ pwm, teamsMap }: { pwm: PredictionWithMatch; teamsMap: Record<string, Team> }) {
  const { prediction: p, match: m } = pwm
  const hFlag = teamsMap[m.homeTeamCode]?.flag ?? ''
  const aFlag = teamsMap[m.awayTeamCode]?.flag ?? ''

  let dotColor: string
  let ptsColor: string
  let ptsText: string
  let dotGlow: string

  if (p.isCorrect) {
    dotColor = 'var(--accent)'
    ptsColor = 'var(--accent-light)'
    ptsText = String(p.points ?? 3)
    dotGlow = '0 0 5px var(--accent)'
  } else if ((p.points ?? 0) > 0) {
    dotColor = 'rgba(255,200,0,0.85)'
    ptsColor = 'rgba(255,210,55,0.85)'
    ptsText = String(p.points)
    dotGlow = 'none'
  } else {
    dotColor = 'rgba(255,255,255,0.14)'
    ptsColor = 'rgba(255,255,255,0.28)'
    ptsText = '0'
    dotGlow = 'none'
  }

  return (
    <div
      className="flex items-center gap-2 py-2 border-b last:border-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      {/* Home team */}
      <span
        className="flex-1 text-right text-xs select-none"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        {hFlag}{' '}
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: '0.82rem',
            letterSpacing: '0.05em',
          }}
        >
          {m.homeTeamCode}
        </span>
      </span>

      {/* Center: result + prediction */}
      <div className="flex flex-col items-center shrink-0" style={{ minWidth: '3.5rem' }}>
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: '1.05rem',
            lineHeight: 1,
            color: '#fff',
            letterSpacing: '0.05em',
          }}
        >
          {m.homeScore ?? '·'}–{m.awayScore ?? '·'}
        </span>
        <span
          style={{
            fontSize: '0.58rem',
            color: 'rgba(255,255,255,0.27)',
            lineHeight: 1,
            marginTop: 2,
            letterSpacing: '0.03em',
          }}
        >
          {resultLabel(p.result)}
        </span>
      </div>

      {/* Away team */}
      <span
        className="flex-1 text-left text-xs select-none"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: '0.82rem',
            letterSpacing: '0.05em',
          }}
        >
          {m.awayTeamCode}
        </span>{' '}
        {aFlag}
      </span>

      {/* Points indicator */}
      <div className="flex items-center gap-1 shrink-0">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dotColor, boxShadow: dotGlow }}
        />
        <span
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: '0.82rem',
            color: ptsColor,
            letterSpacing: '0.04em',
            lineHeight: 1,
            minWidth: '0.7rem',
            textAlign: 'right',
          }}
        >
          {ptsText}
        </span>
      </div>
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
    <div
      style={{
        borderLeft: '3px solid var(--accent)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '0.625rem',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3.5 py-3 transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Animated chevron */}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="var(--accent)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{
              transition: 'transform 0.2s ease',
              transform: `rotate(${isOpen ? 90 : 0}deg)`,
              flexShrink: 0,
              opacity: 0.65,
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>

          <span
            className="text-sm font-medium truncate text-left"
            style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.62)' }}
          >
            {mh.matchday.name}
          </span>
        </div>

        {mh.pointsEarned > 0 ? (
          <span
            className="text-xs font-bold shrink-0 ml-3 px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--accent-deep)',
              border: '1px solid var(--accent-muted)',
              color: 'var(--accent-light)',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
            }}
          >
            +{mh.pointsEarned}pts
          </span>
        ) : (
          <span
            className="text-xs ml-3 shrink-0"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            0pts
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="px-3.5 pb-2 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
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
    return (
      <div className="py-10 text-center">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Cargando historial…
        </p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-center">
        <svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="var(--accent)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          opacity="0.38"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2" />
          <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2" />
          <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2" />
        </svg>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Sin partidos calificados
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.2)', maxWidth: 200 }}
        >
          Los resultados aparecerán cuando termine cada jornada
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
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
    { label: 'Puntos',   value: stats.totalPoints,                                  accent: true  },
    { label: 'Aciertos', value: stats.correctPredictions,  accent: false },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        @keyframes phm-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes phm-sheet-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .phm-overlay { animation: phm-overlay-in 0.2s ease both; }
        .phm-sheet   { animation: phm-sheet-in 0.32s cubic-bezier(.16,1,.3,1) both; }

        .phm-close-btn {
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
          padding: 0.375rem;
          transition: color 0.15s ease, background 0.15s ease;
          flex-shrink: 0;
        }
        .phm-close-btn:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      <div
        className="phm-overlay fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="phm-sheet w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl pb-8"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 -6px 32px rgba(0,0,0,0.6), 0 24px 60px rgba(0,0,0,0.4)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar — mobile only */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.11)' }}
            />
          </div>

          {/* Top accent stripe */}
          <div
            style={{
              height: 3,
              background: 'linear-gradient(to right, var(--accent-light), var(--accent) 45%, transparent 100%)',
            }}
          />

          {/* ── Header with hero gradient ── */}
          <div
            className="relative px-4 pt-4 pb-5"
            style={{
              background: 'linear-gradient(to bottom, var(--accent-deep) 0%, transparent 100%)',
            }}
          >
            <div className="flex items-start gap-4">

              {/* Rectangular FIFA card + position badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
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
                      <span style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: 18,
                        fontWeight: 800,
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                      }}>
                        {getInitials(player.displayName)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Position badge */}
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
                    boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 0 1.5px ${posColor}44`,
                  }}>
                    <span style={{
                      color: posTextColor,
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      fontSize: (position ?? 0) >= 10 ? 12 : 16,
                      lineHeight: 1,
                    }}>
                      {position}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: name + close + stat bar */}
              <div className="flex-1 min-w-0">

                {/* Name row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <p
                      className="truncate leading-tight"
                      style={{
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: '1.7rem',
                        letterSpacing: '0.05em',
                        color: '#fff',
                        lineHeight: 1,
                      }}
                    >
                      {player.displayName}
                    </p>
                    {isOwnProfile && (
                      <span
                        className="shrink-0 text-[8px] font-black tracking-[0.16em] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'var(--accent-muted)',
                          border: '1px solid var(--accent)',
                          color: 'var(--accent-light)',
                        }}
                      >
                        TÚ
                      </span>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="phm-close-btn"
                    aria-label="Cerrar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Unified stat bar */}
                <div
                  className="flex overflow-hidden"
                  style={{
                    borderLeft: '2px solid var(--accent)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '0 0.5rem 0.5rem 0',
                    background: 'rgba(0,0,0,0.22)',
                  }}
                >
                  {statItems.map(({ label, value, accent }, i) => (
                    <div
                      key={label}
                      className="flex-1 text-center py-2"
                      style={{
                        borderRight: i < statItems.length - 1
                          ? '1px solid rgba(255,255,255,0.06)'
                          : 'none',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Bebas Neue', Impact, sans-serif",
                          fontSize: value >= 100 ? '1.3rem' : '1.6rem',
                          lineHeight: 1,
                          color: accent ? 'var(--accent-light)' : '#fff',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {value}
                      </p>
                      <p
                        style={{
                          fontSize: '0.58rem',
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.28)',
                          marginTop: '0.12rem',
                        }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── History content ── */}
          <div className="px-4">
            {isOwnProfile ? (
              <HistoryContent userId={player.uid} teamsMap={teamsMap} />
            ) : (
              <div className="py-8 flex flex-col items-center gap-2.5 text-center">
                <svg
                  width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="var(--accent)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  opacity="0.28"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  El historial detallado solo está disponible en tu propio perfil.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

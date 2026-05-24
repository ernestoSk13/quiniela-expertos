import { useRef } from 'react'
import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

const MEDAL_BG   = ['#FFD700', '#C0C0C0', '#CD7F32']
const MEDAL_TEXT = ['#111', '#111', '#fff']

const COLORS: Record<ThemeId, { bg: string; surface: string; accent: string; border: string; heroStripe: string }> = {
  mexico: { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.25)',  heroStripe: 'rgba(0,200,83,0.13)'  },
  canada: { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.25)', heroStripe: 'rgba(229,20,20,0.13)' },
  usa:    { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.25)', heroStripe: 'rgba(37,53,240,0.13)' },
}

interface Props {
  position: number   // 1-based; 0 means not found
  player: User
  themeId: ThemeId
}

export default function LeaderboardShareCard({ position, player, themeId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const c = COLORS[themeId]

  if (position === 0) return null

  const hasMedal  = position <= 3
  const posColor  = hasMedal ? MEDAL_BG[position - 1]   : 'rgba(255,255,255,0.15)'
  const posText   = hasMedal ? MEDAL_TEXT[position - 1] : 'rgba(255,255,255,0.8)'

  const statItems = [
    { label: 'Puntos',   value: player.stats.totalPoints,                                         accent: true  },
    { label: 'Aciertos', value: player.stats.exactPredictions + player.stats.correctPredictions,  accent: false },
    { label: 'Exactos',  value: player.stats.exactPredictions,                                    accent: false },
  ]

  return (
    <>
      {/* ── Off-screen card for html2canvas ── */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: 400,
          backgroundColor: c.bg,
          borderRadius: 16,
          overflow: 'hidden',
          fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
          boxSizing: 'border-box',
          border: `1.5px solid ${c.border}`,
        }}
      >
        {/* Top accent stripe (3px) */}
        <div style={{
          height: 3,
          background: `linear-gradient(to right, ${c.accent}cc, ${c.accent}88, transparent)`,
        }} />

        {/* Hero header section */}
        <div style={{
          padding: '20px 24px 20px',
          background: `linear-gradient(to bottom, ${c.heroStripe} 0%, transparent 100%)`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          {/* Rectangular avatar card + position badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 80,
              height: 104,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#1a1a1a',
              border: `2.5px solid ${posColor}`,
              boxSizing: 'border-box',
            }}>
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: c.surface,
                }}>
                  <span style={{
                    color: c.accent,
                    fontSize: 22,
                    fontWeight: 800,
                    fontFamily: "'Bebas Neue', Impact, sans-serif",
                  }}>
                    {getInitials(player.displayName)}
                  </span>
                </div>
              )}
            </div>

            {/* Position badge */}
            <div style={{
              position: 'absolute',
              top: -11,
              left: -11,
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: posColor,
              border: '2.5px solid rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px rgba(0,0,0,0.55)`,
            }}>
              <span style={{
                color: posText,
                fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                fontSize: position >= 10 ? 13 : 17,
                lineHeight: 1,
                fontWeight: 900,
              }}>
                {position}
              </span>
            </div>
          </div>

          {/* Right: name + stat bar */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Player name */}
            <div style={{
              fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
              fontSize: 28,
              letterSpacing: '0.05em',
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {player.displayName}
            </div>

            {/* Unified stat bar */}
            <div style={{
              display: 'flex',
              borderLeft: `2.5px solid ${c.accent}`,
              borderTop: `1px solid rgba(255,255,255,0.07)`,
              borderRight: `1px solid rgba(255,255,255,0.07)`,
              borderBottom: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: '0 8px 8px 0',
              background: 'rgba(0,0,0,0.28)',
              overflow: 'hidden',
            }}>
              {statItems.map(({ label, value, accent }, i) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px 6px',
                    borderRight: i < statItems.length - 1
                      ? '1px solid rgba(255,255,255,0.07)'
                      : 'none',
                  }}
                >
                  <div style={{
                    fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                    fontSize: value >= 100 ? 20 : 24,
                    lineHeight: 1,
                    letterSpacing: '0.04em',
                    color: accent ? c.accent : '#ffffff',
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.32)',
                    marginTop: 3,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branding footer */}
        <div style={{
          borderTop: `1px solid ${c.border}`,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          <span style={{ fontSize: 13 }}>⚽</span>
          <span style={{
            fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
            fontSize: 12,
            letterSpacing: '0.14em',
            color: c.accent,
          }}>
            QUINIELA EXPERTOS
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>•</span>
          <span style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            MUNDIAL 2026
          </span>
        </div>
      </div>

      {/* Botón visible en la UI */}
      {/* <button
        onClick={handleShare}
        disabled={sharing}
        className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[var(--accent-light)] border border-gray-800 hover:border-[var(--accent)] rounded-xl py-2.5 transition-colors disabled:opacity-50"
      >
        <ShareIcon />
        {sharing ? 'Generando imagen...' : 'Compartir mi posición'}
      </button> */}
    </>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// function ShareIcon() {
//   return (
//     <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
//       <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
//     </svg>
//   )
// }

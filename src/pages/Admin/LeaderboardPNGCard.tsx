import { useRef, useState } from 'react'
import { captureAndShare } from '@/hooks/useShareImage'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

// 9:16 — iPhone portrait (390×844)
const CARD_W = 390
const CARD_H = 844

const COLORS: Record<ThemeId, { bg: string; surface: string; accent: string; border: string; muted: string }> = {
  mexico: { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.25)',   muted: 'rgba(0,200,83,0.08)' },
  canada: { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.25)',  muted: 'rgba(229,20,20,0.08)' },
  usa:    { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.25)',  muted: 'rgba(37,53,240,0.08)' },
}

const MEDALS = ['🥇', '🥈', '🥉']

function now() {
  return new Date().toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

interface Props {
  players: User[]
}

export default function LeaderboardPNGCard({ players }: Props) {
  const { themeId } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const c = COLORS[themeId]

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      await captureAndShare(cardRef.current, 'quiniela-tabla-general')
    } catch {
      // silencioso
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      {/* Card off-screen — 390×844 (9:16 mobile) */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: CARD_W,
          height: CARD_H,
          backgroundColor: c.bg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: `1px solid ${c.border}`,
          backgroundColor: c.surface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>⚽</span>
            <div>
              <div style={{ color: c.accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Quiniela Expertos
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: '0.05em' }}>
                Mundial 2026
              </div>
            </div>
          </div>
          <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Tabla General
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 3 }}>
            {now()}
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 20px',
          backgroundColor: c.muted,
          borderBottom: `1px solid ${c.border}`,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', width: 28 }}>#</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1 }}>Jugador</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', width: 44, textAlign: 'right' }}>Pts</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', width: 44, textAlign: 'right' }}>Exactos</span>
        </div>

        {/* Player rows */}
        <div style={{ flex: 1, overflowY: 'hidden' }}>
          {players.map((player, i) => {
            const isTop3 = i < 3
            const rowBg = isTop3
              ? i === 0 ? 'rgba(255,215,0,0.06)'
              : i === 1 ? 'rgba(192,192,192,0.04)'
              : 'rgba(205,127,50,0.04)'
              : i % 2 === 0 ? 'transparent' : c.muted

            return (
              <div
                key={player.uid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 20px',
                  height: 48,
                  backgroundColor: rowBg,
                  borderBottom: `1px solid ${c.border}`,
                }}
              >
                {/* Position */}
                <div style={{ width: 28, flexShrink: 0 }}>
                  {isTop3 ? (
                    <span style={{ fontSize: 16 }}>{MEDALS[i]}</span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                  )}
                </div>

                {/* Name */}
                <div style={{
                  flex: 1,
                  color: isTop3 ? '#ffffff' : 'rgba(255,255,255,0.8)',
                  fontSize: 13,
                  fontWeight: isTop3 ? 700 : 500,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  paddingRight: 8,
                }}>
                  {player.displayName}
                </div>

                {/* Points */}
                <div style={{
                  width: 44,
                  textAlign: 'right',
                  color: isTop3 ? c.accent : '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {player.stats.totalPoints}
                </div>

                {/* Exactos */}
                <div style={{
                  width: 44,
                  textAlign: 'right',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  fontWeight: 500,
                  flexShrink: 0,
                }}>
                  {player.stats.exactPredictions}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${c.border}`,
          backgroundColor: c.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
            {players.length} participantes
          </span>
          <span style={{ color: c.accent, fontSize: 10, fontWeight: 600 }}>
            quinielaexpertos26.web.app
          </span>
        </div>
      </div>

      {/* Botón visible */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        <ShareIcon />
        {sharing ? 'Generando imagen...' : 'Compartir tabla'}
      </button>
    </>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
    </svg>
  )
}

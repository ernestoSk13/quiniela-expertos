import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { captureAndShare } from '@/hooks/useShareImage'
import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

const MEDAL_BG = ['#FFD700', '#C0C0C0', '#CD7F32']

const COLORS: Record<ThemeId, { bg: string; surface: string; accent: string; border: string; heroStripe: string }> = {
  mexico:       { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.25)',    heroStripe: 'rgba(0,200,83,0.13)' },
  canada:       { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.25)',   heroStripe: 'rgba(229,20,20,0.13)' },
  usa:          { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.25)',   heroStripe: 'rgba(37,53,240,0.13)' },
  germany:      { bg: '#0a0000', surface: '#200505', accent: '#DD0000', border: 'rgba(221,0,0,0.25)',     heroStripe: 'rgba(221,0,0,0.13)' },
  france:       { bg: '#01010c', surface: '#0a0d22', accent: '#002395', border: 'rgba(0,35,149,0.25)',    heroStripe: 'rgba(0,35,149,0.13)' },
  argentina:    { bg: '#01050c', surface: '#0c1620', accent: '#74ACDF', border: 'rgba(116,172,223,0.28)', heroStripe: 'rgba(116,172,223,0.13)' },
  spain:        { bg: '#0a0101', surface: '#200a0a', accent: '#AA151B', border: 'rgba(170,21,27,0.25)',   heroStripe: 'rgba(170,21,27,0.13)' },
  belgium:      { bg: '#0a0102', surface: '#200a0c', accent: '#EF3340', border: 'rgba(239,51,64,0.25)',   heroStripe: 'rgba(239,51,64,0.13)' },
  'ivory-coast':{ bg: '#0a0500', surface: '#221500', accent: '#F77F00', border: 'rgba(247,127,0,0.25)',   heroStripe: 'rgba(247,127,0,0.13)' },
  brazil:       { bg: '#010801', surface: '#0a1a0a', accent: '#009C3B', border: 'rgba(0,156,59,0.25)',    heroStripe: 'rgba(0,156,59,0.13)' },
  portugal:     { bg: '#0a0101', surface: '#200c0c', accent: '#C8102E', border: 'rgba(200,16,46,0.25)',   heroStripe: 'rgba(200,16,46,0.13)' },
  netherlands:  { bg: '#0a0500', surface: '#221600', accent: '#FF6C00', border: 'rgba(255,108,0,0.25)',   heroStripe: 'rgba(255,108,0,0.13)' },
  japan:        { bg: '#0a0002', surface: '#200810', accent: '#BC002D', border: 'rgba(188,0,45,0.25)',    heroStripe: 'rgba(188,0,45,0.13)' },
  england:      { bg: '#0a0102', surface: '#200a10', accent: '#CF142B', border: 'rgba(207,20,43,0.25)',   heroStripe: 'rgba(207,20,43,0.13)' },
}

interface Props {
  position: number   // 1-based; 0 means not found
  player: User
  themeId: ThemeId
}

export default function LeaderboardShareCard({ position, player, themeId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const c = COLORS[themeId]

  if (position === 0) return null

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      // Esperar a que todas las web fonts (Bebas Neue) estén completamente cargadas
      await document.fonts.ready
      const imgs = cardRef.current.querySelectorAll('img')
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve()
        return new Promise<void>(resolve => {
          img.onload  = () => resolve()
          img.onerror = () => resolve()
        })
      }))
      await captureAndShare(cardRef.current, 'quiniela-mi-posicion')
    } catch {
      // silencioso
    } finally {
      setSharing(false)
    }
  }

  const hasMedal  = position <= 3
  const posColor  = hasMedal ? MEDAL_BG[position - 1] : 'rgba(255,255,255,0.15)'

  const statItems = [
    { label: 'Puntos',   value: player.stats.totalPoints,          accent: true  },
    { label: 'Aciertos', value: player.stats.correctPredictions,   accent: false },
  ]

  const offScreenCard = (
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
          padding: '16px 24px 20px',
          background: `linear-gradient(to bottom, ${c.heroStripe} 0%, transparent 100%)`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          {/* Avatar card — sin wrapper, sin posicionamiento absoluto */}
          <div style={{
            flexShrink: 0,
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

          {/* Right: nombre con badge inline + stat bar */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Badge + nombre — inline-block para alineación confiable en html2canvas */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: 'inline-block',
                width: 28,
                height: 28,
                verticalAlign: 'middle',
                fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                fontSize: 22,
                letterSpacing: '0.04em',
                color: posColor,
                lineHeight: 1,
              }}>
                {position}
              </div>

              {/* Nombre inline-block */}
              <div style={{
                display: 'inline-block',
                width: 28,
                height: 28,
                verticalAlign: 'middle',
                fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                fontSize: 22,
                letterSpacing: '0.04em',
                color: '#ffffff',
                lineHeight: 1,
              }}>
                {player.displayName}
              </div>
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
  )

  return (
    <>
      {createPortal(offScreenCard, document.body)}

      {/* Botón visible */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl py-2.5 transition-all disabled:opacity-40"
        style={{
          color: sharing ? 'var(--accent-light)' : 'rgba(255,255,255,0.45)',
          border: '1px solid rgba(255,255,255,0.09)',
          background: sharing ? 'var(--accent-deep)' : 'transparent',
        }}
        onMouseEnter={e => {
          if (!sharing) {
            e.currentTarget.style.color = 'var(--accent-light)'
            e.currentTarget.style.borderColor = 'var(--accent-muted)'
            e.currentTarget.style.background = 'var(--accent-deep)'
          }
        }}
        onMouseLeave={e => {
          if (!sharing) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <ShareIcon />
        {sharing ? 'Generando...' : 'Compartir mi posición'}
      </button>
    </>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
    </svg>
  )
}

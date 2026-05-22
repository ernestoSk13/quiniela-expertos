import { useRef, useState } from 'react'
import { captureAndShare } from '@/hooks/useShareImage'
import { useTheme } from '@/context/ThemeContext'
import LeaderboardRow, { ROW_H, ROW_GAP } from '@/components/LeaderboardRow'
import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

const CARD_W = 420
const HEADER_H = 140
const FOOTER_H = 52
const MIN_CARD_H = 480

const THEME_BG: Record<ThemeId, { bg: string; surface: string; accent: string; border: string }> = {
  mexico: { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.20)' },
  canada: { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.20)' },
  usa:    { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.20)' },
}

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
  const c = THEME_BG[themeId]
  const rowsTotalH = players.length * ROW_H + Math.max(0, players.length - 1) * ROW_GAP
  const CARD_H = Math.max(
    MIN_CARD_H,
    HEADER_H + 16 + rowsTotalH + 16 + FOOTER_H,
  )

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const imgs = cardRef.current.querySelectorAll('img')
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve()
        return new Promise<void>(resolve => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      }))
      await captureAndShare(cardRef.current, 'quiniela-tabla-general', { forceDownload: true })
    } catch {
      // silencioso
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      {/* Card off-screen */}
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
        }}
      >
        {/* Header */}
        <div style={{
          height: HEADER_H,
          boxSizing: 'border-box',
          padding: '24px 24px 20px',
          borderBottom: `1px solid ${c.border}`,
          backgroundColor: c.surface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>⚽</span>
            <div>
              <div style={{ color: c.accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.4 }}>
                Quiniela Expertos
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.05em', lineHeight: 1.4 }}>
                Mundial 2026
              </div>
            </div>
          </div>
          <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Tabla General
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
            {now()}
          </div>
        </div>

        {/* Player rows */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
          {players.map((player, i) => (
            <LeaderboardRow
              key={player.uid}
              player={player}
              position={i + 1}
              themeId={themeId}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          height: FOOTER_H,
          boxSizing: 'border-box',
          padding: '0 24px',
          borderTop: `1px solid ${c.border}`,
          backgroundColor: c.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>
            {players.length} participantes
          </span>
          <span style={{ color: c.accent, fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
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

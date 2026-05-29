import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { captureAndShare } from '@/hooks/useShareImage'
import { useTheme } from '@/context/ThemeContext'
import LeaderboardRow, { ROW_H, ROW_GAP } from '@/components/LeaderboardRow'
import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const CARD_W   = 420
const HEADER_H = 140   // excluding the 3px top stripe
const FOOTER_H = 44
const MIN_CARD_H = 480
const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
const SYS   = 'system-ui, -apple-system, sans-serif'

const COLORS: Record<ThemeId, {
  bg: string; surface: string; accent: string; border: string
  accentLight: string; heroStripe: string
}> = {
  mexico: { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.22)',  accentLight: '#69F0AE', heroStripe: 'rgba(0,200,83,0.13)' },
  canada: { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.22)', accentLight: '#FF6B6B', heroStripe: 'rgba(229,20,20,0.13)' },
  usa:    { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.22)', accentLight: '#7B8BFF', heroStripe: 'rgba(37,53,240,0.13)' },
}

function now() {
  return new Date().toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
    </svg>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  players: User[]
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LeaderboardPNGCard({ players }: Props) {
  const { themeId } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const c = COLORS[themeId]

  const rowsTotalH = players.length * ROW_H + Math.max(0, players.length - 1) * ROW_GAP
  const CARD_H = Math.max(
    MIN_CARD_H,
    3 + HEADER_H + 16 + rowsTotalH + 16 + FOOTER_H,
  )

  const topPlayer = players[0] ?? null
  const totalAciertos = players.reduce((acc, p) => acc + p.stats.correctPredictions, 0)

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const imgs = cardRef.current.querySelectorAll('img')
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve()
        return new Promise<void>(resolve => {
          img.onload  = () => resolve()
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

  // ── Off-screen card ────────────────────────────────────────────────────────

  const offScreenCard = (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: CARD_W,
        height: CARD_H,
        backgroundColor: c.bg,
        fontFamily: SYS,
        boxSizing: 'border-box',
        border: `1.5px solid ${c.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* 3px top stripe */}
      <div style={{
        height: 3,
        background: `linear-gradient(to right, ${c.accentLight}cc, ${c.accent}88, transparent)`,
      }} />

      {/* ── Hero header ── */}
      <div style={{
        height: HEADER_H,
        boxSizing: 'border-box',
        padding: '16px 20px 14px',
        background: `linear-gradient(to bottom, ${c.heroStripe} 0%, transparent 100%)`,
        borderBottom: `1px solid ${c.border}`,
      }}>

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {/* ⚽ circle */}
          <div style={{
            width: 28, height: 28, borderRadius: 99,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>⚽</span>
          </div>
          {/* Brand label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 8, letterSpacing: '0.18em', color: c.accent,
              textTransform: 'uppercase', fontFamily: SYS, fontWeight: 700,
            }}>
              Quiniela Expertos · Mundial 2026
            </div>
          </div>
          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '3px 7px',
            }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: SYS, letterSpacing: '0.06em' }}>
                {players.length} jug.
              </span>
            </div>
            <div style={{
              background: `${c.accent}1a`, border: `1px solid ${c.accent}33`,
              borderRadius: 99, padding: '3px 7px',
            }}>
              <span style={{ fontSize: 8, color: c.accentLight, fontFamily: SYS, letterSpacing: '0.06em' }}>
                {totalAciertos} aciertos
              </span>
            </div>
          </div>
        </div>

        {/* Title + leader chip */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: BEBAS, fontSize: 26, color: '#ffffff',
              letterSpacing: '0.06em', lineHeight: 1,
            }}>
              TABLA GENERAL
            </div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 4,
              fontFamily: SYS, letterSpacing: '0.04em',
            }}>
              {now()}
            </div>
          </div>

          {/* Leader chip */}
          {topPlayer && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '7px 10px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>🏆</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SYS }}>
                  Líder
                </div>
                <div style={{
                  fontSize: 11, color: '#ffffff', fontWeight: 700, fontFamily: SYS,
                  lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: 90,
                }}>
                  {topPlayer.displayName}
                </div>
              </div>
              <div style={{
                fontFamily: BEBAS, fontSize: 22, color: c.accent,
                letterSpacing: '0.04em', lineHeight: 1, flexShrink: 0,
              }}>
                {topPlayer.stats.totalPoints}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Player rows ── */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: ROW_GAP,
      }}>
        {players.map((player, i) => (
          <LeaderboardRow
            key={player.uid}
            player={player}
            position={i + 1}
            themeId={themeId}
          />
        ))}
      </div>

      {/* ── Branding footer ── */}
      <div style={{
        height: FOOTER_H,
        boxSizing: 'border-box',
        padding: '0 20px',
        borderTop: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <span style={{ fontSize: 11 }}>⚽</span>
        <span style={{ fontFamily: BEBAS, fontSize: 11, color: c.accent, letterSpacing: '0.14em' }}>
          QUINIELA EXPERTOS
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
        <span style={{ fontFamily: SYS, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', flex: 1 }}>
          MUNDIAL 2026
        </span>
        <span style={{ fontFamily: SYS, fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em' }}>
          quinielaexpertos26.web.app
        </span>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {createPortal(offScreenCard, document.body)}

      {/* Visible export button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
        style={{
          color: sharing ? 'var(--accent-light)' : 'rgba(255,255,255,0.45)',
          border: '1px solid rgba(255,255,255,0.09)',
          background: sharing ? 'var(--accent-deep)' : 'rgba(255,255,255,0.04)',
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
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }
        }}
      >
        <ShareIcon />
        {sharing ? 'Generando...' : 'Exportar tabla'}
      </button>
    </>
  )
}

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { captureAndShare } from '@/hooks/useShareImage'
import type { ThemeId } from '@/lib/themes'
import type { Match, Prediction, PredictionResult } from '@/types'

function resultLabel(r: PredictionResult | null | undefined): string {
  if (r === 'home') return 'LOCAL'
  if (r === 'draw') return 'EMPATE'
  if (r === 'away') return 'VISIT.'
  return '—'
}

const COLORS: Record<ThemeId, {
  bg: string; surface: string; accent: string; border: string
  heroStripe: string; accentLight: string
}> = {
  mexico:       { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.25)',    heroStripe: 'rgba(0,200,83,0.13)',    accentLight: '#69F0AE' },
  canada:       { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.25)',   heroStripe: 'rgba(229,20,20,0.13)',   accentLight: '#FF6B6B' },
  usa:          { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.25)',   heroStripe: 'rgba(37,53,240,0.13)',   accentLight: '#7B8BFF' },
  germany:      { bg: '#0a0000', surface: '#200505', accent: '#DD0000', border: 'rgba(221,0,0,0.25)',     heroStripe: 'rgba(221,0,0,0.13)',     accentLight: '#FF6666' },
  france:       { bg: '#01010c', surface: '#0a0d22', accent: '#002395', border: 'rgba(0,35,149,0.25)',    heroStripe: 'rgba(0,35,149,0.13)',    accentLight: '#4D7FFF' },
  argentina:    { bg: '#01050c', surface: '#0c1620', accent: '#74ACDF', border: 'rgba(116,172,223,0.28)', heroStripe: 'rgba(116,172,223,0.13)', accentLight: '#A8D4F5' },
  spain:        { bg: '#0a0101', surface: '#200a0a', accent: '#AA151B', border: 'rgba(170,21,27,0.25)',   heroStripe: 'rgba(170,21,27,0.13)',   accentLight: '#FF5555' },
  belgium:      { bg: '#0a0102', surface: '#200a0c', accent: '#EF3340', border: 'rgba(239,51,64,0.25)',   heroStripe: 'rgba(239,51,64,0.13)',   accentLight: '#FF7080' },
  'ivory-coast':{ bg: '#0a0500', surface: '#221500', accent: '#F77F00', border: 'rgba(247,127,0,0.25)',   heroStripe: 'rgba(247,127,0,0.13)',   accentLight: '#FFB366' },
  brazil:       { bg: '#010801', surface: '#0a1a0a', accent: '#009C3B', border: 'rgba(0,156,59,0.25)',    heroStripe: 'rgba(0,156,59,0.13)',    accentLight: '#33D668' },
  portugal:     { bg: '#0a0101', surface: '#200c0c', accent: '#C8102E', border: 'rgba(200,16,46,0.25)',   heroStripe: 'rgba(200,16,46,0.13)',   accentLight: '#FF6677' },
  netherlands:  { bg: '#0a0500', surface: '#221600', accent: '#FF6C00', border: 'rgba(255,108,0,0.25)',   heroStripe: 'rgba(255,108,0,0.13)',   accentLight: '#FFAA55' },
  japan:        { bg: '#0a0002', surface: '#200810', accent: '#BC002D', border: 'rgba(188,0,45,0.25)',    heroStripe: 'rgba(188,0,45,0.13)',    accentLight: '#FF5577' },
  england:      { bg: '#0a0102', surface: '#200a10', accent: '#CF142B', border: 'rgba(207,20,43,0.25)',   heroStripe: 'rgba(207,20,43,0.13)',   accentLight: '#FF5566' },
}

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
const SYS   = 'system-ui, -apple-system, sans-serif'

interface Props {
  matchdayName: string
  matches: Match[]
  predictions: Record<string, Prediction>
  themeId: ThemeId
}

// ── Points pill (compact for 2-col layout) ─────────────────────────────────────

function PointsPill({ pts }: { pts: number | null | undefined }) {
  if (pts === 3) return (
    <span style={{
      background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.30)',
      color: '#4ade80', borderRadius: 99, padding: '0px 5px',
      fontSize: 9, fontWeight: 700, fontFamily: SYS, flexShrink: 0, lineHeight: '14px',
    }}>+3</span>
  )
  if (pts === 1) return (
    <span style={{
      background: 'rgba(250,204,21,0.10)', border: '1px solid rgba(250,204,21,0.28)',
      color: '#facc15', borderRadius: 99, padding: '0px 5px',
      fontSize: 9, fontWeight: 700, fontFamily: SYS, flexShrink: 0, lineHeight: '14px',
    }}>+1</span>
  )
  return (
    <span style={{
      color: 'rgba(255,255,255,0.18)', fontSize: 9, fontFamily: SYS,
      flexShrink: 0, minWidth: 18, textAlign: 'right' as const, lineHeight: '14px',
    }}>
      {pts === 0 ? '+0' : '—'}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function JornadaShareCard({ matchdayName, matches, predictions, themeId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const c = COLORS[themeId]

  const scoredMatches = matches.filter(m => predictions[m.id]?.points != null)
  const totalPts = scoredMatches.reduce((acc, m) => acc + (predictions[m.id]?.points ?? 0), 0)
  const aciertos = scoredMatches.filter(m => predictions[m.id]?.isCorrect).length

  if (scoredMatches.length === 0) return null

  // Group matches into pairs for 2-column layout
  const pairs: Match[][] = []
  for (let i = 0; i < scoredMatches.length; i += 2) {
    pairs.push(scoredMatches.slice(i, Math.min(i + 2, scoredMatches.length)))
  }

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const slug = matchdayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      await captureAndShare(cardRef.current, `quiniela-${slug}`)
    } catch {
      // silencioso
    } finally {
      setSharing(false)
    }
  }

  // Render off-screen card via portal to avoid clipping by sticky parent containers
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
        boxSizing: 'border-box',
        border: `1.5px solid ${c.border}`,
      }}
    >
      {/* Top stripe */}
      <div style={{
        height: 3,
        background: `linear-gradient(to right, ${c.accentLight}cc, ${c.accent}88, transparent)`,
      }} />

      {/* Hero header */}
      <div style={{
        padding: '14px 20px 12px',
        background: `linear-gradient(to bottom, ${c.heroStripe} 0%, transparent 100%)`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, lineHeight: 1 }}>⚽</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 8, letterSpacing: '0.18em', color: c.accent,
            textTransform: 'uppercase', fontFamily: SYS, fontWeight: 700,
          }}>
            Quiniela Expertos · Mundial 2026
          </div>
          <div style={{
            fontFamily: BEBAS, fontSize: 17, color: '#ffffff',
            letterSpacing: '0.04em', lineHeight: 1.15, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {matchdayName}
          </div>
        </div>
      </div>

      {/* Match rows — 2-column grid */}
      <div style={{ padding: '8px 14px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {pairs.map((pair, pi) => (
          <div key={pi} style={{ display: 'flex', gap: 4 }}>
            {pair.map(match => {
              const pred = predictions[match.id]
              const pts = pred?.points ?? null
              return (
                <div
                  key={match.id}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 6,
                    padding: '5px 7px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    borderLeft: pts === 3
                      ? '2px solid rgba(74,222,128,0.28)'
                      : pts === 1
                      ? '2px solid rgba(250,204,21,0.22)'
                      : '2px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Fixture */}
                  <span style={{
                    flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: SYS,
                  }}>
                    {match.homeTeamCode}–{match.awayTeamCode}
                  </span>
                  {/* Real result */}
                  <span style={{
                    fontFamily: BEBAS, fontSize: 12, color: 'rgba(255,255,255,0.28)',
                    letterSpacing: '0.04em', flexShrink: 0,
                  }}>
                    {match.homeScore ?? '?'}–{match.awayScore ?? '?'}
                  </span>
                  {/* Divider */}
                  <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 8, flexShrink: 0 }}>|</span>
                  {/* Prediction */}
                  <span style={{
                    fontFamily: BEBAS, fontSize: 12, color: '#ffffff',
                    letterSpacing: '0.04em', flexShrink: 0,
                  }}>
                    {resultLabel(pred?.result)}
                  </span>
                  {/* Points pill */}
                  <PointsPill pts={pts} />
                </div>
              )
            })}
            {/* Filler for odd last row */}
            {pair.length === 1 && <div style={{ flex: 1 }} />}
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ padding: '4px 14px 14px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, backgroundColor: c.accent, borderRadius: 10, padding: '9px 6px', textAlign: 'center' }}>
          <div style={{ fontFamily: BEBAS, fontSize: 24, color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
            {totalPts}
          </div>
          <div style={{ fontSize: 7, fontFamily: SYS, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)', marginTop: 3 }}>
            Pts jornada
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: c.surface, borderRadius: 10, padding: '9px 6px', textAlign: 'center' }}>
          <div style={{ fontFamily: BEBAS, fontSize: 24, color: c.accent, letterSpacing: '0.04em', lineHeight: 1 }}>
            {aciertos}
          </div>
          <div style={{ fontSize: 7, fontFamily: SYS, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>
            Aciertos
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: c.surface, borderRadius: 10, padding: '9px 6px', textAlign: 'center' }}>
          <div style={{ fontFamily: BEBAS, fontSize: 24, color: c.accent, letterSpacing: '0.04em', lineHeight: 1 }}>
            {scoredMatches.length}
          </div>
          <div style={{ fontSize: 7, fontFamily: SYS, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>
            Partidos
          </div>
        </div>
      </div>

      {/* Branding footer */}
      <div style={{
        borderTop: `1px solid ${c.border}`,
        padding: '7px 18px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 11 }}>⚽</span>
        <span style={{ fontFamily: BEBAS, fontSize: 11, color: c.accent, letterSpacing: '0.14em' }}>
          QUINIELA EXPERTOS
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
        <span style={{ fontFamily: SYS, fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>
          MUNDIAL 2026
        </span>
      </div>
    </div>
  )

  return (
    <>
      {createPortal(offScreenCard, document.body)}

      {/* ── Visible share button ── */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1.5 text-xs font-medium shrink-0 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
        style={{
          color: sharing ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent',
        }}
        onMouseEnter={e => {
          if (!sharing) {
            e.currentTarget.style.color = 'var(--accent-light)'
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.background = 'var(--accent-deep)'
          }
        }}
        onMouseLeave={e => {
          if (!sharing) {
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <ShareIcon />
        {sharing ? 'Generando...' : 'Compartir'}
      </button>
    </>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
    </svg>
  )
}

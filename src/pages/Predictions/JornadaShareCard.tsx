import { useRef, useState } from 'react'
import { captureAndShare } from '@/hooks/useShareImage'
import type { ThemeId } from '@/lib/themes'
import type { Match } from '@/types'
import type { Prediction } from '@/types'

const COLORS: Record<ThemeId, { bg: string; surface: string; accent: string; border: string; muted: string }> = {
  mexico: { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.3)',   muted: 'rgba(0,200,83,0.1)' },
  canada: { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.3)',  muted: 'rgba(229,20,20,0.1)' },
  usa:    { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.3)',  muted: 'rgba(37,53,240,0.1)' },
}

interface Props {
  matchdayName: string
  matches: Match[]
  predictions: Record<string, Prediction>
  themeId: ThemeId
}

function pointsColor(pts: number | null | undefined) {
  if (pts === 3) return '#4ade80'  // green
  if (pts === 1) return '#facc15'  // yellow
  if (pts === 0) return 'rgba(255,255,255,0.3)'  // gray
  return 'rgba(255,255,255,0.2)'   // null
}

export default function JornadaShareCard({ matchdayName, matches, predictions, themeId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const c = COLORS[themeId]

  const scoredMatches = matches.filter(m => predictions[m.id]?.points != null)
  const totalPts = scoredMatches.reduce((acc, m) => acc + (predictions[m.id]?.points ?? 0), 0)
  const exactos = scoredMatches.filter(m => predictions[m.id]?.isExact).length

  if (scoredMatches.length === 0) return null

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

  return (
    <>
      {/* Card off-screen */}
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px 28px',
          boxSizing: 'border-box',
          border: `1.5px solid ${c.border}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>⚽</span>
          <div>
            <div style={{ color: c.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Quiniela Expertos · Mundial 2026
            </div>
            <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginTop: 1 }}>
              {matchdayName}
            </div>
          </div>
        </div>

        {/* Match rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
          {scoredMatches.map(match => {
            const pred = predictions[match.id]
            const pts = pred?.points ?? null
            return (
              <div
                key={match.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: c.surface,
                  borderRadius: 8,
                  padding: '7px 12px',
                  gap: 8,
                }}
              >
                {/* Teams */}
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {match.homeTeamCode} – {match.awayTeamCode}
                </span>

                {/* Real result */}
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, whiteSpace: 'nowrap' }}>
                  {match.homeScore ?? '?'}–{match.awayScore ?? '?'}
                </span>

                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>|</span>

                {/* Prediction */}
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, whiteSpace: 'nowrap' }}>
                  {pred?.homeScore ?? '—'}–{pred?.awayScore ?? '—'}
                </span>

                {/* Points badge */}
                <span style={{
                  color: pointsColor(pts),
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 24,
                  textAlign: 'right',
                }}>
                  {pts != null ? `+${pts}` : '—'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div style={{
          display: 'flex',
          gap: 8,
        }}>
          <div style={{ flex: 1, backgroundColor: c.accent, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{totalPts}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>pts jornada</div>
          </div>
          <div style={{ flex: 1, backgroundColor: c.surface, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ color: c.accent, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{exactos}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>exactos</div>
          </div>
          <div style={{ flex: 1, backgroundColor: c.surface, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ color: c.accent, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{scoredMatches.length - exactos}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 }}>correctos</div>
          </div>
        </div>
      </div>

      {/* Botón visible */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[var(--accent-light)] border border-gray-800 hover:border-[var(--accent)] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 shrink-0"
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

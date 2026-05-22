import { useRef, useState } from 'react'
import { captureAndShare } from '@/hooks/useShareImage'
import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']

const COLORS: Record<ThemeId, { bg: string; surface: string; accent: string; border: string }> = {
  mexico: { bg: '#010a04', surface: '#0c1f0f', accent: '#00C853', border: 'rgba(0,200,83,0.3)' },
  canada: { bg: '#0a0101', surface: '#1a0606', accent: '#E51414', border: 'rgba(229,20,20,0.3)' },
  usa:    { bg: '#01020c', surface: '#080b1e', accent: '#2535F0', border: 'rgba(37,53,240,0.3)' },
}

interface Props {
  position: number  // 1-based; 0 means not found
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
      await captureAndShare(cardRef.current, `quiniela-pos${position}`)
    } catch {
      // silencioso — el usuario canceló o el navegador no soporta
    } finally {
      setSharing(false)
    }
  }

  const medal = position <= 3 ? MEDALS[position - 1] : null

  return (
    <>
      {/* Card off-screen para html2canvas */}
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
          padding: '28px 32px 24px',
          boxSizing: 'border-box',
          border: `1.5px solid ${c.border}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 18 }}>⚽</span>
          <div>
            <div style={{ color: c.accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Quiniela Expertos
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: '0.05em' }}>
              Mundial 2026
            </div>
          </div>
        </div>

        {/* Position + name */}
        <div style={{ backgroundColor: c.surface, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{medal ?? `#${position}`}</span>
            {medal && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: 600 }}>
                #{position}
              </span>
            )}
          </div>
          <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {player.displayName}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Puntos', value: player.stats.totalPoints, highlight: true },
            { label: 'Exactos', value: player.stats.exactPredictions, highlight: false },
            { label: 'Correctos', value: player.stats.correctPredictions, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              style={{
                flex: 1,
                backgroundColor: highlight ? c.accent : c.surface,
                borderRadius: 10,
                padding: '12px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{
                color: highlight ? '#ffffff' : c.accent,
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {value}
              </div>
              <div style={{ color: highlight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón visible en la UI */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[var(--accent-light)] border border-gray-800 hover:border-[var(--accent)] rounded-xl py-2.5 transition-colors disabled:opacity-50"
      >
        <ShareIcon />
        {sharing ? 'Generando imagen...' : 'Compartir mi posición'}
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

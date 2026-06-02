import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import type { User } from '@/types'

export type AccentId = 'gold' | 'silver' | 'bronze' | 'green' | 'red' | 'blue'

export const ACCENT_OPTIONS: { id: AccentId; label: string; swatch: string }[] = [
  { id: 'gold',   label: 'Dorado', swatch: '#D97706' },
  { id: 'silver', label: 'Plata',  swatch: '#8A8A95' },
  { id: 'bronze', label: 'Bronce', swatch: '#A05018' },
  { id: 'green',  label: 'Verde',  swatch: '#047A50' },
  { id: 'red',    label: 'Rojo',   swatch: '#C81E1E' },
  { id: 'blue',   label: 'Azul',   swatch: '#1D4FD0' },
]

// Full-card gradient colors — top (dark) → bottom (vibrant)
const COLORS: Record<AccentId, { top: string; bottom: string }> = {
  gold:   { top: '#4A1C03', bottom: '#C07808' },
  silver: { top: '#18181B', bottom: '#71717A' },
  bronze: { top: '#4A1C03', bottom: '#934E15' },
  green:  { top: '#022C22', bottom: '#047A50' },
  red:    { top: '#7F1D1D', bottom: '#C81E1E' },
  blue:   { top: '#172060', bottom: '#1D4FD0' },
}

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
const W = 340
const H = 480

export interface PaniniCardProps {
  player: User
  title: string
  showPoints: boolean
  showPosition: boolean
  accentId: AccentId
  position: number
  cardRef?: RefObject<HTMLDivElement | null>
  offScreen?: boolean
}

function CardInner({ player, title, showPoints, showPosition, position }: Omit<PaniniCardProps, 'cardRef' | 'offScreen' | 'accentId'>) {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap')`}</style>

      {/* Header — semi-transparent dark overlay on top of the card gradient */}
      <div style={{
        width: W, height: 82, flexShrink: 0,
        background: 'rgba(0,0,0,0.30)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ fontFamily: BEBAS, fontSize: 10, letterSpacing: '0.26em', color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>
          QUINIELA EXPERTOS
        </div>
        <div style={{ fontFamily: BEBAS, fontSize: 22, letterSpacing: '0.14em', color: '#fff', lineHeight: 1 }}>
          MUNDIAL 2026
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '18px 24px 12px',
      }}>
        {/* Avatar */}
        <div style={{
          width: 132, height: 170, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
          border: '2.5px solid rgba(255,255,255,0.65)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.15)',
          marginBottom: 16, background: 'rgba(0,0,0,0.3)',
        }}>
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              alt={player.displayName}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: BEBAS, fontSize: 52, color: 'rgba(255,255,255,0.7)',
            }}>
              {player.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Player name */}
        <div style={{
          fontFamily: BEBAS, fontSize: 28, letterSpacing: '0.06em', color: '#fff',
          textAlign: 'center', lineHeight: 1.1, marginBottom: 10, maxWidth: 280,
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
          {player.displayName.toUpperCase()}
        </div>

        {/* Decorative line + award title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, width: '85%' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.35))' }} />
          <div style={{
            fontFamily: BEBAS, fontSize: 17, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            {title || 'PREMIO'}
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.35))' }} />
        </div>

        {/* Stats badges */}
        {(showPoints || showPosition) && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {showPosition && position > 0 && (
              <div style={{
                background: 'rgba(0,0,0,0.30)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 20, padding: '5px 16px',
                fontFamily: BEBAS, fontSize: 17, letterSpacing: '0.06em',
                color: '#fff',
              }}>
                #{position} en tabla
              </div>
            )}
            {showPoints && (
              <div style={{
                background: 'rgba(0,0,0,0.30)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 20, padding: '5px 16px',
                fontFamily: BEBAS, fontSize: 17, letterSpacing: '0.06em',
                color: '#fff',
              }}>
                ⭐ {player.stats.totalPoints} pts
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderTop: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ fontFamily: BEBAS, fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)' }}>
          QUINIELAEXPERTOS26.WEB.APP
        </div>
      </div>
    </>
  )
}

export default function PaniniCard(props: PaniniCardProps) {
  const { player, title, showPoints, showPosition, accentId, position, cardRef, offScreen } = props
  const c = COLORS[accentId]

  const card = (
    <div
      ref={cardRef}
      style={{
        width: W, height: H, flexShrink: 0,
        background: `linear-gradient(165deg, ${c.top} 0%, ${c.bottom} 100%)`,
        borderRadius: offScreen ? 0 : 14,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        border: offScreen ? 'none' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: offScreen ? 'none' : `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)`,
        position: offScreen ? 'absolute' : 'relative',
        left: offScreen ? -9999 : undefined,
        top: offScreen ? 0 : undefined,
      }}
    >
      <CardInner
        player={player} title={title} showPoints={showPoints}
        showPosition={showPosition} position={position}
      />
    </div>
  )

  if (offScreen) return createPortal(card, document.body)
  return card
}

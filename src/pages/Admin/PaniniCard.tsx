import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import type { User } from '@/types'

export type AccentId = 'gold' | 'silver' | 'bronze' | 'green' | 'red' | 'blue'

export const ACCENT_OPTIONS: { id: AccentId; label: string; swatch: string }[] = [
  { id: 'gold',   label: 'Dorado', swatch: '#F59E0B' },
  { id: 'silver', label: 'Plata',  swatch: '#A1A1AA' },
  { id: 'bronze', label: 'Bronce', swatch: '#CD7C3A' },
  { id: 'green',  label: 'Verde',  swatch: '#10B981' },
  { id: 'red',    label: 'Rojo',   swatch: '#EF4444' },
  { id: 'blue',   label: 'Azul',   swatch: '#3B82F6' },
]

const COLORS: Record<AccentId, {
  primary: string
  gradientA: string
  gradientB: string
  titleText: string
  badgeBg: string
}> = {
  gold:   { primary: '#F59E0B', gradientA: '#78350F', gradientB: '#D97706', titleText: '#FCD34D', badgeBg: 'rgba(245,158,11,0.18)' },
  silver: { primary: '#A1A1AA', gradientA: '#3F3F46', gradientB: '#A1A1AA', titleText: '#E4E4E7', badgeBg: 'rgba(161,161,170,0.18)' },
  bronze: { primary: '#CD7C3A', gradientA: '#78350F', gradientB: '#B45309', titleText: '#FDBA74', badgeBg: 'rgba(205,124,58,0.18)' },
  green:  { primary: '#10B981', gradientA: '#064E3B', gradientB: '#059669', titleText: '#6EE7B7', badgeBg: 'rgba(16,185,129,0.18)' },
  red:    { primary: '#EF4444', gradientA: '#7F1D1D', gradientB: '#DC2626', titleText: '#FCA5A5', badgeBg: 'rgba(239,68,68,0.18)' },
  blue:   { primary: '#3B82F6', gradientA: '#1E3A8A', gradientB: '#2563EB', titleText: '#93C5FD', badgeBg: 'rgba(59,130,246,0.18)' },
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

function CardInner({ player, title, showPoints, showPosition, accentId, position }: Omit<PaniniCardProps, 'cardRef' | 'offScreen'>) {
  const c = COLORS[accentId]

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap')`}</style>

      {/* Header */}
      <div style={{
        width: W, height: 82, flexShrink: 0,
        background: `linear-gradient(135deg, ${c.gradientA} 0%, ${c.gradientB} 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.primary }} />
        <div style={{ fontFamily: BEBAS, fontSize: 10, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>
          QUINIELA EXPERTOS
        </div>
        <div style={{ fontFamily: BEBAS, fontSize: 22, letterSpacing: '0.14em', color: '#fff', lineHeight: 1 }}>
          MUNDIAL 2026
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '20px 24px 12px', gap: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: 108, height: 140, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${c.primary}`, boxShadow: `0 0 24px ${c.primary}55`,
          marginBottom: 16, background: '#181828',
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
              fontFamily: BEBAS, fontSize: 44, color: c.primary,
            }}>
              {player.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <div style={{
          fontFamily: BEBAS, fontSize: 26, letterSpacing: '0.06em', color: '#fff',
          textAlign: 'center', lineHeight: 1.1, marginBottom: 10, maxWidth: 280,
        }}>
          {player.displayName.toUpperCase()}
        </div>

        {/* Decorative line + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, width: '85%' }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${c.primary}55)` }} />
          <div style={{
            fontFamily: BEBAS, fontSize: 17, letterSpacing: '0.1em',
            color: c.titleText, textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap',
          }}>
            {title || 'PREMIO'}
          </div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${c.primary}55)` }} />
        </div>

        {/* Stats badges */}
        {(showPoints || showPosition) && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {showPosition && position > 0 && (
              <div style={{
                background: c.badgeBg, border: `1px solid ${c.primary}44`,
                borderRadius: 20, padding: '5px 16px',
                fontFamily: BEBAS, fontSize: 17, letterSpacing: '0.06em', color: c.titleText,
              }}>
                #{position} en tabla
              </div>
            )}
            {showPoints && (
              <div style={{
                background: c.badgeBg, border: `1px solid ${c.primary}44`,
                borderRadius: 20, padding: '5px 16px',
                fontFamily: BEBAS, fontSize: 17, letterSpacing: '0.06em', color: c.titleText,
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
        borderTop: `1px solid ${c.primary}22`,
      }}>
        <div style={{ fontFamily: BEBAS, fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.22)' }}>
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
        background: '#0C0D14',
        borderRadius: offScreen ? 0 : 14,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        border: offScreen ? 'none' : `1px solid ${c.primary}33`,
        boxShadow: offScreen ? 'none' : `0 8px 40px ${c.primary}1A, 0 0 0 1px ${c.primary}22`,
        position: offScreen ? 'absolute' : 'relative',
        left: offScreen ? -9999 : undefined,
        top: offScreen ? 0 : undefined,
      }}
    >
      <CardInner
        player={player} title={title} showPoints={showPoints}
        showPosition={showPosition} accentId={accentId} position={position}
      />
    </div>
  )

  if (offScreen) return createPortal(card, document.body)
  return card
}

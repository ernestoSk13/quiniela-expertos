import type { ThemeId } from '@/lib/themes'
import type { User } from '@/types'

export const ROW_H = 48
export const ROW_GAP = 4
export const MINI_W = 40

interface ThemeColors {
  accent: string
  rowDark: string
  rowLight: string
}

const COLORS: Record<ThemeId, ThemeColors> = {
  mexico:       { accent: '#00C853', rowDark: 'rgba(0,200,83,0.14)',    rowLight: 'rgba(0,200,83,0.05)' },
  canada:       { accent: '#E51414', rowDark: 'rgba(229,20,20,0.14)',   rowLight: 'rgba(229,20,20,0.05)' },
  usa:          { accent: '#2535F0', rowDark: 'rgba(37,53,240,0.16)',   rowLight: 'rgba(37,53,240,0.06)' },
  germany:      { accent: '#DD0000', rowDark: 'rgba(221,0,0,0.14)',     rowLight: 'rgba(221,0,0,0.05)' },
  france:       { accent: '#002395', rowDark: 'rgba(0,35,149,0.16)',    rowLight: 'rgba(0,35,149,0.06)' },
  argentina:    { accent: '#74ACDF', rowDark: 'rgba(116,172,223,0.18)', rowLight: 'rgba(116,172,223,0.07)' },
  spain:        { accent: '#AA151B', rowDark: 'rgba(170,21,27,0.14)',   rowLight: 'rgba(170,21,27,0.05)' },
  belgium:      { accent: '#EF3340', rowDark: 'rgba(239,51,64,0.14)',   rowLight: 'rgba(239,51,64,0.05)' },
  'ivory-coast':{ accent: '#F77F00', rowDark: 'rgba(247,127,0,0.14)',   rowLight: 'rgba(247,127,0,0.05)' },
  brazil:       { accent: '#009C3B', rowDark: 'rgba(0,156,59,0.14)',    rowLight: 'rgba(0,156,59,0.05)' },
}

const MEDAL_BORDER = ['#FFD700', '#C0C0C0', '#CD7F32']

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Props {
  player: User
  position: number // 1-indexed
  themeId: ThemeId
  isCurrentUser?: boolean
  onClick?: () => void
}

export default function LeaderboardRow({ player, position, themeId, isCurrentUser = false, onClick }: Props) {
  const c = COLORS[themeId]
  const i = position - 1
  const isTop3 = i < 3
  const rowBg = i % 2 === 0 ? c.rowDark : c.rowLight
  const miniBorder = isTop3 ? MEDAL_BORDER[i] : 'rgba(255,255,255,0.18)'

  return (
    <div
      onClick={onClick}
      className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_H,
        paddingTop: 0,
        paddingRight: 12,
        paddingBottom: 0,
        paddingLeft: 0,
        backgroundColor: rowBg,
        borderRadius: 6,
        gap: 10,
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: isCurrentUser ? `0 0 0 1.5px ${c.accent}` : undefined,
      }}
    >
      {/* Mini player card */}
      <div style={{
        width: MINI_W,
        height: ROW_H,
        flexShrink: 0,
        position: 'relative',
        backgroundColor: '#1a1a1a',
        border: `1.5px solid ${miniBorder}`,
        borderRadius: 6,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            crossOrigin="anonymous"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 1,
            }}>
              {getInitials(player.displayName)}
            </span>
          </div>
        )}
      </div>

      {/* Name + stat */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minWidth: 0,
      }}>
        <div style={{
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          minWidth: 0,
        }}>
          <span style={{
            color: isTop3 ? MEDAL_BORDER[i] : 'rgba(255,255,255,0.55)',
            fontWeight: 800,
            flexShrink: 0,
          }}>{position}.</span>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}>{player.displayName}</span>
          {isCurrentUser && (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: c.accent,
              backgroundColor: 'rgba(0,0,0,0.35)',
              padding: '1px 6px',
              borderRadius: 999,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>tú</span>
          )}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 10,
          fontWeight: 500,
          lineHeight: 1.3,
          marginTop: 2,
        }}>
          {player.stats.correctPredictions} {player.stats.correctPredictions === 1 ? 'acierto' : 'aciertos'}
        </div>
      </div>

      {/* Big points */}
      <div style={{
        flexShrink: 0,
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        minWidth: 32,
        textAlign: 'right',
      }}>
        {player.stats.totalPoints}
      </div>
    </div>
  )
}

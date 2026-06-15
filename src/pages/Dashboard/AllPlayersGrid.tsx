import type { GridData } from '@/hooks/useAllPlayersGrid'
import type { User, Team, Prediction } from '@/types'

interface Props {
  players: User[]
  data: GridData
  teamsMap: Record<string, Team>
}

const LEFT_COL = 122
const MATCH_COL = 30
const ROW_H = 36
const SURFACE = 'var(--surface-card)'
const BORDER = 'rgba(255,255,255,0.06)'
const BORDER_MD = 'rgba(255,255,255,0.12)'

const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32']

function CellDot({ pred }: { pred: Prediction | undefined }) {
  if (!pred || pred.result == null) {
    return (
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.1)',
        margin: 'auto',
      }} />
    )
  }
  if (pred.isCorrect) {
    return (
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--accent)',
        boxShadow: '0 0 5px var(--accent)',
        margin: 'auto',
      }} />
    )
  }
  if ((pred.points ?? 0) > 0) {
    return (
      <div style={{
        width: 9, height: 9, borderRadius: '50%',
        background: 'rgba(250,200,50,0.75)',
        margin: 'auto',
      }} />
    )
  }
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: 'rgba(255,255,255,0.13)',
      margin: 'auto',
    }} />
  )
}

export default function AllPlayersGrid({ players, data, teamsMap }: Props) {
  const { matchdays, matches, predByKey } = data

  if (matches.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Sin partidos finalizados aún
        </p>
      </div>
    )
  }

  const matchesByMd = Object.fromEntries(
    matchdays.map(md => [md.id, matches.filter(m => m.matchdayId === md.id)])
  )

  // Precompute which match IDs are the first in their matchday (for left border)
  const firstMatchInMd = new Set(
    matchdays.flatMap(md => {
      const first = matchesByMd[md.id]?.[0]
      return first ? [first.id] : []
    })
  )

  return (
    <div>
      <div style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as any,
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
      }}>
        <table style={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: LEFT_COL + matches.length * MATCH_COL,
        }}>
          <colgroup>
            <col style={{ width: LEFT_COL }} />
            {matches.map(m => <col key={m.id} style={{ width: MATCH_COL }} />)}
          </colgroup>

          <thead>
            {/* Row 1 — matchday group headers */}
            <tr>
              <th
                rowSpan={2}
                style={{
                  position: 'sticky', left: 0, zIndex: 3,
                  background: SURFACE,
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.28)',
                  borderBottom: `1px solid ${BORDER_MD}`,
                  borderRight: `1px solid ${BORDER_MD}`,
                }}
              >
                Jugador
              </th>
              {matchdays.map((md, i) => {
                const mdMatches = matchesByMd[md.id] ?? []
                if (mdMatches.length === 0) return null
                return (
                  <th
                    key={md.id}
                    colSpan={mdMatches.length}
                    style={{
                      background: SURFACE,
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: i % 2 === 0 ? 'rgba(255,255,255,0.38)' : 'var(--accent-light)',
                      textAlign: 'center',
                      padding: '5px 0 2px',
                      borderLeft: `1px solid ${BORDER_MD}`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {md.name}
                  </th>
                )
              })}
            </tr>

            {/* Row 2 — match headers (flags + score) */}
            <tr>
              {matches.map((m, mIdx) => (
                <th
                  key={m.id}
                  style={{
                    background: SURFACE,
                    padding: '4px 0 5px',
                    borderBottom: `1px solid ${BORDER_MD}`,
                    borderLeft: firstMatchInMd.has(m.id) && mIdx > 0 ? `1px solid ${BORDER_MD}` : undefined,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: 11, lineHeight: 1 }}>
                      {teamsMap[m.homeTeamCode]?.flag ?? '🏳️'}
                    </span>
                    {m.homeScore != null && (
                      <span style={{
                        fontSize: 7,
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        letterSpacing: '0.03em',
                        color: 'rgba(255,255,255,0.38)',
                        lineHeight: 1,
                      }}>
                        {m.homeScore}‑{m.awayScore}
                      </span>
                    )}
                    <span style={{ fontSize: 11, lineHeight: 1 }}>
                      {teamsMap[m.awayTeamCode]?.flag ?? '🏳️'}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {players.map((player, idx) => (
              <tr key={player.uid}>
                {/* Player cell — sticky left */}
                <td
                  style={{
                    position: 'sticky', left: 0, zIndex: 1,
                    background: SURFACE,
                    padding: '0 10px',
                    height: ROW_H,
                    borderTop: `1px solid ${BORDER}`,
                    borderRight: `1px solid ${BORDER_MD}`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      fontSize: 9,
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      color: idx < 3 ? MEDAL[idx] : 'rgba(255,255,255,0.28)',
                      minWidth: 14,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.82)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {player.displayName}
                    </span>
                  </div>
                </td>

                {/* Match cells */}
                {matches.map((match, mIdx) => (
                  <td
                    key={match.id}
                    style={{
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      height: ROW_H,
                      borderTop: `1px solid ${BORDER}`,
                      borderLeft: firstMatchInMd.has(match.id) && mIdx > 0 ? `1px solid ${BORDER}` : undefined,
                      padding: 0,
                    }}
                  >
                    <CellDot pred={predByKey[`${player.uid}_${match.id}`]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 10, paddingLeft: 2 }}>
        {[
          { style: { background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)', width: 9, height: 9 }, label: 'Acierto' },
          { style: { background: 'rgba(250,200,50,0.75)', width: 9, height: 9 }, label: 'Pts extra' },
          { style: { background: 'rgba(255,255,255,0.13)', width: 8, height: 8 }, label: 'Fallo' },
          { style: { border: '1px solid rgba(255,255,255,0.1)', width: 8, height: 8 }, label: 'Sin pronóstico' },
        ].map(({ style, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ borderRadius: '50%', flexShrink: 0, ...style }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

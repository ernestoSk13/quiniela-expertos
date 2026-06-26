import { useState } from 'react'
import type { GridData } from '@/hooks/useAllPlayersGrid'
import type { User, Team, Match, Prediction } from '@/types'

interface Props {
  players: User[]
  data: GridData
  teamsMap: Record<string, Team>
}

const LEFT_COL = 122
const MATCH_COL = 32
const TOTAL_COL = 36
const ROW_H = 36
const SURFACE = 'var(--surface-card)'
const BORDER = 'rgba(255,255,255,0.06)'
const BORDER_MD = 'rgba(255,255,255,0.12)'

const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32']

type PhaseFilter = 'groups' | 'playoffs'

type GridColumn =
  | { kind: 'match'; match: Match; isFirst: boolean }
  | { kind: 'total'; matchdayId: string }

function CellPoints({ pred }: { pred: Prediction | undefined }) {
  if (!pred || pred.result == null) {
    return (
      <span style={{
        fontSize: 9,
        color: 'rgba(255,255,255,0.12)',
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        display: 'block',
        textAlign: 'center',
        lineHeight: 1,
      }}>–</span>
    )
  }
  const pts = pred.points ?? 0
  let color: string
  if (pred.isCorrect) {
    color = 'var(--accent-light)'
  } else if (pts > 0) {
    color = 'rgba(250,200,50,0.9)'
  } else {
    color = 'rgba(255,255,255,0.22)'
  }
  return (
    <span style={{
      fontSize: 10,
      fontFamily: "'Bebas Neue', Impact, sans-serif",
      color,
      display: 'block',
      textAlign: 'center',
      lineHeight: 1,
      letterSpacing: '0.02em',
    }}>
      {pts}
    </span>
  )
}

export default function AllPlayersGrid({ players, data, teamsMap }: Props) {
  const { matchdays, matches, predByKey } = data

  const hasGroups = matchdays.some(md => md.phase === 'group_stage')
  const hasPlayoffs = matchdays.some(md => md.phase !== 'group_stage')
  const showControl = hasGroups && hasPlayoffs

  const [phase, setPhase] = useState<PhaseFilter>(() =>
    hasPlayoffs ? 'playoffs' : 'groups'
  )

  const visibleMatchdays = matchdays.filter(md =>
    phase === 'groups' ? md.phase === 'group_stage' : md.phase !== 'group_stage'
  )
  const visibleMatchdayIds = new Set(visibleMatchdays.map(md => md.id))
  const visibleMatches = matches.filter(m => visibleMatchdayIds.has(m.matchdayId))

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
    visibleMatchdays.map(md => [md.id, visibleMatches.filter(m => m.matchdayId === md.id)])
  )

  // Flat column list: matches + one total column per matchday
  const columns: GridColumn[] = []
  visibleMatchdays.forEach(md => {
    const mdMatches = matchesByMd[md.id] ?? []
    mdMatches.forEach((m, i) => {
      columns.push({ kind: 'match', match: m, isFirst: i === 0 })
    })
    if (mdMatches.length > 0) {
      columns.push({ kind: 'total', matchdayId: md.id })
    }
  })

  const totalMinWidth = LEFT_COL +
    columns.reduce((sum, col) => sum + (col.kind === 'total' ? TOTAL_COL : MATCH_COL), 0)

  return (
    <div>
      {/* Segmented control — only when both phases have data */}
      {showControl && (
        <div
          className="flex mb-4 p-0.5 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {(['groups', 'playoffs'] as PhaseFilter[]).map(seg => {
            const isActive = phase === seg
            return (
              <button
                key={seg}
                onClick={() => setPhase(seg)}
                className="flex-1 py-2.5 rounded-md"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: '0.82rem',
                  letterSpacing: '0.12em',
                  transition: 'background 0.18s ease, color 0.18s ease',
                  boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.35)' : 'none',
                }}
              >
                {seg === 'groups' ? 'Fase de Grupos' : 'Playoffs'}
              </button>
            )
          })}
        </div>
      )}

      {/* Scoring banner — playoffs only */}
      {phase === 'playoffs' && (
        <div
          className="mb-4 px-3 py-2.5 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <p style={{
            fontSize: 8,
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Puntuación playoffs
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
            {[
              { pts: '5', label: 'Marcador exacto' },
              { pts: '2', label: 'Resultado correcto' },
              { pts: '1', label: 'Goles de un equipo' },
              { pts: '1', label: 'Desempate correcto' },
            ].map(({ pts, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: 14,
                  color: 'var(--accent-light)',
                  lineHeight: 1,
                }}>
                  {pts}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as any,
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
      }}>
        <table style={{
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          minWidth: totalMinWidth,
        }}>
          <colgroup>
            <col style={{ width: LEFT_COL }} />
            {columns.map((col, i) => (
              <col
                key={col.kind === 'match' ? col.match.id : `total-${col.matchdayId}-${i}`}
                style={{ width: col.kind === 'total' ? TOTAL_COL : MATCH_COL }}
              />
            ))}
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
              {visibleMatchdays.map((md, i) => {
                const mdMatches = matchesByMd[md.id] ?? []
                if (mdMatches.length === 0) return null
                return (
                  <th
                    key={md.id}
                    colSpan={mdMatches.length + 1}
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

            {/* Row 2 — match headers + total headers */}
            <tr>
              {columns.map((col, i) => {
                if (col.kind === 'total') {
                  return (
                    <th
                      key={`total-hdr-${col.matchdayId}`}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        padding: '4px 0 5px',
                        borderBottom: `1px solid ${BORDER_MD}`,
                        borderLeft: `1px solid ${BORDER_MD}`,
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      <span style={{
                        fontSize: 7,
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        color: 'rgba(255,255,255,0.38)',
                        letterSpacing: '0.06em',
                      }}>
                        TOTAL
                      </span>
                    </th>
                  )
                }
                const m = col.match
                return (
                  <th
                    key={m.id}
                    style={{
                      background: SURFACE,
                      padding: '4px 0 5px',
                      borderBottom: `1px solid ${BORDER_MD}`,
                      borderLeft: col.isFirst && i > 0 ? `1px solid ${BORDER_MD}` : undefined,
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
                )
              })}
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

                {columns.map((col, i) => {
                  if (col.kind === 'total') {
                    const mdMatches = matchesByMd[col.matchdayId] ?? []
                    const hasAny = mdMatches.some(
                      m => predByKey[`${player.uid}_${m.id}`] != null
                    )
                    const total = mdMatches.reduce(
                      (sum, m) => sum + (predByKey[`${player.uid}_${m.id}`]?.points ?? 0),
                      0
                    )
                    return (
                      <td
                        key={`total-${col.matchdayId}-${player.uid}`}
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          height: ROW_H,
                          borderTop: `1px solid ${BORDER}`,
                          borderLeft: `1px solid ${BORDER_MD}`,
                          padding: 0,
                        }}
                      >
                        {hasAny ? (
                          <span style={{
                            fontSize: 10,
                            fontFamily: "'Bebas Neue', Impact, sans-serif",
                            color: total > 0 ? 'var(--accent-light)' : 'rgba(255,255,255,0.22)',
                            display: 'block',
                            textAlign: 'center',
                            lineHeight: 1,
                            letterSpacing: '0.02em',
                          }}>
                            {total}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.12)',
                            fontFamily: "'Bebas Neue', Impact, sans-serif",
                            display: 'block',
                            textAlign: 'center',
                            lineHeight: 1,
                          }}>–</span>
                        )}
                      </td>
                    )
                  }

                  return (
                    <td
                      key={col.match.id}
                      style={{
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: ROW_H,
                        borderTop: `1px solid ${BORDER}`,
                        borderLeft: col.isFirst && i > 0 ? `1px solid ${BORDER}` : undefined,
                        padding: 0,
                      }}
                    >
                      <CellPoints pred={predByKey[`${player.uid}_${col.match.id}`]} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 10, paddingLeft: 2 }}>
        {[
          { dot: { background: 'var(--accent-light)', boxShadow: '0 0 4px var(--accent)', width: 9, height: 9 }, label: 'Acierto' },
          { dot: { background: 'rgba(250,200,50,0.85)', width: 9, height: 9 }, label: 'Pts parciales' },
          { dot: { background: 'rgba(255,255,255,0.18)', width: 8, height: 8 }, label: 'Fallo' },
          { dot: { border: '1px solid rgba(255,255,255,0.15)', width: 8, height: 8 }, label: 'Sin pronóstico' },
        ].map(({ dot, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ borderRadius: '50%', flexShrink: 0, ...dot }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

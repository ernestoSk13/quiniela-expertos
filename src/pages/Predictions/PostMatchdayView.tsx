import { useMemo } from 'react'
import Avatar from '@/components/Avatar'
import { useAllMatchdayPredictions } from '@/hooks/useAllMatchdayPredictions'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { Match, Prediction, Team } from '@/types'

interface Props {
  matchdayId: string
  matches: Match[]
  teamsMap: Record<string, Team>
}

// ── Points badge ───────────────────────────────────────────────────────────────

function PointsBadge({ points, isExact }: { points: number | null; isExact: boolean | null }) {
  if (points === null) {
    return (
      <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.75rem', width: 32, textAlign: 'right', flexShrink: 0 }}>
        —
      </span>
    )
  }
  if (isExact) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        padding: '2px 7px',
        borderRadius: 99,
        background: 'rgba(0,200,83,0.12)',
        border: '1px solid rgba(0,200,83,0.30)',
        color: 'rgba(0,200,83,0.9)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        boxShadow: '0 0 8px rgba(0,200,83,0.2)',
        flexShrink: 0,
      }}>
        +3
      </span>
    )
  }
  if (points === 1) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        padding: '2px 7px',
        borderRadius: 99,
        background: 'rgba(255,190,50,0.10)',
        border: '1px solid rgba(255,190,50,0.28)',
        color: 'rgba(255,200,60,0.85)',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}>
        +1
      </span>
    )
  }
  return (
    <span style={{
      color: 'rgba(255,255,255,0.15)',
      fontSize: '0.75rem',
      width: 32,
      textAlign: 'right',
      flexShrink: 0,
    }}>
      ·
    </span>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="pmv-skeleton rounded-xl overflow-hidden">
      {/* top stripe */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.04)' }} />
      {/* header */}
      <div className="pmv-shimmer-block" style={{ height: 72, margin: '0 0 1px' }} />
      {/* rows */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div className="pmv-shimmer-block" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
          <div className="pmv-shimmer-block" style={{ flex: 1, height: 10, borderRadius: 4 }} />
          <div className="pmv-shimmer-block" style={{ width: 36, height: 10, borderRadius: 4 }} />
          <div className="pmv-shimmer-block" style={{ width: 28, height: 18, borderRadius: 99 }} />
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PostMatchdayView({ matchdayId, matches, teamsMap }: Props) {
  const { predictions, loading: predsLoading } = useAllMatchdayPredictions(matchdayId, true)
  const { players, loading: playersLoading } = useLeaderboard()

  const predMap = useMemo(() => {
    const map = new Map<string, Map<string, Prediction>>()
    for (const pred of predictions) {
      if (!map.has(pred.matchId)) map.set(pred.matchId, new Map())
      map.get(pred.matchId)!.set(pred.userId, pred)
    }
    return map
  }, [predictions])

  if (predsLoading || playersLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="space-y-3 pb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>
      <div className="space-y-3 pb-6">
        {matches.map(match => {
          const matchPreds = predMap.get(match.id)
          const homeFlag = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
          const awayFlag = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
          const hasResult = match.homeScore !== null && match.awayScore !== null

          const sortedPlayers = [...players].sort((a, b) => {
            const pa = matchPreds?.get(a.uid)
            const pb = matchPreds?.get(b.uid)
            if (!pa && !pb) return 0
            if (!pa) return 1
            if (!pb) return -1
            const ptsA = pa.points ?? -1
            const ptsB = pb.points ?? -1
            return ptsB - ptsA
          })

          return (
            <div
              key={match.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* 3px top accent stripe */}
              <div style={{
                height: 3,
                background: 'linear-gradient(to right, var(--accent), var(--accent-muted), transparent)',
              }} />

              {/* Hero match header */}
              <div style={{
                background: 'linear-gradient(to bottom, var(--accent-deep) 0%, transparent 100%)',
                padding: '14px 16px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                  {/* Home team */}
                  <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                    <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{homeFlag}</div>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 4,
                      textTransform: 'uppercase',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {match.homeTeamCode}
                    </div>
                  </div>

                  {/* Score / VS */}
                  <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    padding: '0 12px',
                    borderLeft: '1px solid rgba(255,255,255,0.07)',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    {hasResult ? (
                      <span style={{
                        fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                        fontSize: '2.2rem',
                        lineHeight: 1,
                        letterSpacing: '0.08em',
                        color: '#ffffff',
                      }}>
                        {match.homeScore}–{match.awayScore}
                      </span>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                          fontSize: '1.5rem',
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.25)',
                        }}>
                          VS
                        </div>
                        <div style={{
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          letterSpacing: '0.2em',
                          color: 'var(--accent)',
                          textTransform: 'uppercase',
                          marginTop: 1,
                        }}>
                          EN CURSO
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Away team */}
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{awayFlag}</div>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 4,
                      textTransform: 'uppercase',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {match.awayTeamCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player prediction rows */}
              <div>
                {sortedPlayers.map((player, idx) => {
                  const pred = matchPreds?.get(player.uid)
                  const isExactRow = pred?.isExact === true
                  const isCorrectRow = pred?.points === 1

                  const scoreColor = isExactRow
                    ? 'var(--accent-light)'
                    : isCorrectRow
                    ? 'rgba(255,200,50,0.85)'
                    : 'rgba(255,255,255,0.65)'

                  return (
                    <div
                      key={player.uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '8px 12px',
                        borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        background: isExactRow ? 'rgba(0,200,83,0.04)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <Avatar url={player.avatarUrl} name={player.displayName} size="sm" />

                      <span style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                        {player.displayName}
                      </span>

                      {pred ? (
                        <>
                          <span style={{
                            fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                            fontSize: '1.05rem',
                            letterSpacing: '0.04em',
                            color: scoreColor,
                            flexShrink: 0,
                          }}>
                            {pred.homeScore}–{pred.awayScore}
                          </span>
                          <PointsBadge points={pred.points} isExact={pred.isExact} />
                        </>
                      ) : (
                        <span style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255,255,255,0.18)',
                          flexShrink: 0,
                          letterSpacing: '0.02em',
                        }}>
                          sin pronóstico
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes pmv-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .pmv-skeleton {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.05);
  }

  .pmv-shimmer-block {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 800px 100%;
    animation: pmv-shimmer 1.6s ease-in-out infinite;
  }
`

import { useEffect } from 'react'
import type { User, Team } from '@/types'

const MEXICO_PHASE_LABELS: Record<string, string> = {
  grupos:  'Fase de grupos',
  ronda32: 'Ronda de 32',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semis:   'Semifinales',
  tercero: 'Tercer lugar',
  campeon: 'Campeón',
}

const COLUMNS = [
  { key: 'topScorer'   as const, label: 'Goleador',       width: 108 },
  { key: 'goldenBall'  as const, label: 'Balón de Oro',   width: 108 },
  { key: 'mexicoPhase' as const, label: 'México llega a', width: 96  },
  { key: 'champion'    as const, label: 'Campeón',        width: 116 },
]

type BonusKey = typeof COLUMNS[number]['key']

const LEFT_COL = 134
const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32']

interface Props {
  players: User[]
  teamsMap: Record<string, Team>
  currentUserId: string
  onClose: () => void
}

export default function BonusAllModal({ players, teamsMap, currentUserId, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function getCellValue(player: User, key: BonusKey): string {
    const bp = player.bonusPredictions
    if (!bp) return '—'
    const raw = bp[key]
    if (!raw) return '—'
    if (key === 'mexicoPhase') return MEXICO_PHASE_LABELS[raw] ?? raw
    if (key === 'champion') {
      const team = teamsMap[raw]
      return team ? `${team.flag} ${team.name}` : raw
    }
    return raw
  }

  const totalWidth = LEFT_COL + COLUMNS.reduce((sum, c) => sum + c.width, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes bam-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bam-sheet-in {
          from { opacity: 0; transform: translateY(18px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .bam-overlay { animation: bam-overlay-in 0.2s ease both }
        .bam-sheet   { animation: bam-sheet-in 0.32s cubic-bezier(.16,1,.3,1) both }
        .bam-close:hover { color: rgba(255,255,255,0.85) !important; background: rgba(255,255,255,0.1) !important; }
      `}</style>

      <div
        className="bam-overlay fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bam-sheet w-full max-w-2xl max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 -6px 32px rgba(0,0,0,0.6), 0 24px 60px rgba(0,0,0,0.4)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle — mobile */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.11)' }} />
          </div>

          {/* Top accent stripe */}
          <div style={{
            height: 3,
            background: 'linear-gradient(to right, var(--accent-light), var(--accent) 45%, transparent 100%)',
            flexShrink: 0,
          }} />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div>
              <h2 style={{
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: '1.4rem',
                letterSpacing: '0.06em',
                color: '#fff',
                lineHeight: 1,
              }}>
                Bonus de todos
              </h2>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.32)', marginTop: 2, letterSpacing: '0.04em' }}>
                {players.length} jugadores
              </p>
            </div>
            <button
              className="bam-close"
              onClick={onClose}
              style={{
                color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '0.5rem',
                padding: '0.375rem',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-y-auto overflow-x-auto flex-1 px-4 pb-6">
            <table style={{
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              minWidth: totalWidth,
              width: '100%',
            }}>
              <colgroup>
                <col style={{ width: LEFT_COL }} />
                {COLUMNS.map(c => <col key={c.key} style={{ width: c.width }} />)}
              </colgroup>

              <thead>
                <tr>
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 2,
                    background: 'var(--surface-card)',
                    textAlign: 'left',
                    padding: '8px 10px 8px 6px',
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    whiteSpace: 'nowrap',
                  }}>
                    Jugador
                  </th>
                  {COLUMNS.map(c => (
                    <th key={c.key} style={{
                      textAlign: 'left',
                      padding: '8px 8px',
                      fontSize: 8,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.25)',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      borderLeft: '1px solid rgba(255,255,255,0.06)',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {players.map((player, idx) => {
                  const isMe = player.uid === currentUserId
                  const ptsAwarded = player.bonusPredictions?.pointsAwarded === true
                  return (
                    <tr key={player.uid}>
                      {/* Player cell — sticky */}
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 1,
                        background: isMe ? 'var(--accent-deep)' : 'var(--surface-card)',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: isMe ? '3px solid var(--accent)' : '3px solid transparent',
                        padding: '9px 10px 9px 4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}>
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
                            color: isMe ? '#fff' : 'rgba(255,255,255,0.78)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: isMe ? 600 : 400,
                          }}>
                            {player.displayName}
                          </span>
                          {isMe && (
                            <span style={{
                              fontSize: 7,
                              fontWeight: 800,
                              letterSpacing: '0.14em',
                              padding: '1px 4px',
                              borderRadius: 4,
                              background: 'var(--accent-muted)',
                              border: '1px solid var(--accent)',
                              color: 'var(--accent-light)',
                              flexShrink: 0,
                            }}>
                              TÚ
                            </span>
                          )}
                          {ptsAwarded && (
                            <span style={{
                              fontSize: 7,
                              letterSpacing: '0.08em',
                              padding: '1px 4px',
                              borderRadius: 4,
                              background: 'rgba(74,222,128,0.12)',
                              border: '1px solid rgba(74,222,128,0.28)',
                              color: 'rgba(74,222,128,0.85)',
                              flexShrink: 0,
                            }}>
                              ✓ pts
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bonus value cells */}
                      {COLUMNS.map(c => (
                        <td key={c.key} style={{
                          background: isMe ? 'var(--accent-deep)' : 'transparent',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          borderLeft: '1px solid rgba(255,255,255,0.06)',
                          padding: '9px 8px',
                          fontSize: 11,
                          color: isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: c.width,
                        }}>
                          {getCellValue(player, c.key)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

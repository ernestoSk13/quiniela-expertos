import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { useMatchdays } from '@/hooks/useMatchdays'
import { updateMatchdayStatus, updateMatchdayDeadline } from '@/services/firestoreMatchdays'
import { getMatchCountByMatchday } from '@/services/firestoreMatches'
import { getMatchdayAllPredictions } from '@/services/firestorePredictions'
import { getAllUsers } from '@/services/firestoreUsers'
import StatusBadge from '@/components/StatusBadge'
import type { Matchday, MatchdayStatus } from '@/types'

interface PendingPlayer {
  uid: string
  displayName: string
  filled: number
  total: number
}

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

const STATUS_CYCLE: Record<MatchdayStatus, MatchdayStatus> = {
  upcoming: 'open',
  open:     'closed',
  closed:   'finished',
  finished: 'upcoming',
}

const STATUS_CYCLE_LABEL: Record<MatchdayStatus, string> = {
  upcoming: 'Abrir',
  open:     'Cerrar',
  closed:   'Finalizar',
  finished: 'Reactivar',
}

const STATUS_BORDER: Record<MatchdayStatus, string> = {
  upcoming: 'rgba(255,255,255,0.1)',
  open:     'var(--accent)',
  closed:   'rgba(250,204,21,0.5)',
  finished: 'rgba(74,222,128,0.45)',
}

function formatDate(ts: Matchday['predictionDeadline'], timezone: string) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }) ?? '—'
}

function toDatetimeLocal(ts: Matchday['predictionDeadline']): string {
  if (!ts) return ''
  const d = ts.toDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="mdl-skeleton rounded-xl overflow-hidden" style={{ height: 76 }}>
      <div style={{ width: 4, position: 'absolute', top: 0, bottom: 0, left: 0, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MatchdayList() {
  const { matchdays, loading } = useMatchdays()
  const timezone = useUserTimezone()
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null)
  const [deadlineInput, setDeadlineInput] = useState('')
  const [savingDeadline, setSavingDeadline] = useState(false)
  const [pendingPlayers, setPendingPlayers] = useState<PendingPlayer[]>([])
  const [openMatchdayName, setOpenMatchdayName] = useState<string>('')

  const openMatchday = matchdays.find(md => md.status === 'open')

  useEffect(() => {
    if (!openMatchday?.id) {
      setPendingPlayers([])
      setOpenMatchdayName('')
      return
    }
    const mdId = openMatchday.id
    setOpenMatchdayName(openMatchday.name)

    Promise.all([
      getAllUsers(),
      getMatchdayAllPredictions(mdId),
      getMatchCountByMatchday(mdId),
    ]).then(([users, predictions, matchCount]) => {
      const participants = users.filter(u => u.onboardingCompleted && u.role !== 'observer')
      const filledByUser: Record<string, number> = {}
      predictions.forEach(p => {
        filledByUser[p.userId] = (filledByUser[p.userId] ?? 0) + 1
      })
      const pending = participants
        .filter(u => (filledByUser[u.uid] ?? 0) < matchCount)
        .map(u => ({ uid: u.uid, displayName: u.displayName, filled: filledByUser[u.uid] ?? 0, total: matchCount }))
        .sort((a, b) => a.filled - b.filled)
      setPendingPlayers(pending)
    })
  }, [openMatchday?.id])

  async function handleStatusChange(md: Matchday) {
    setUpdating(md.id)
    try {
      await updateMatchdayStatus(md.id, STATUS_CYCLE[md.status])
    } finally {
      setUpdating(null)
    }
  }

  function startEditDeadline(md: Matchday) {
    setEditingDeadline(md.id)
    setDeadlineInput(toDatetimeLocal(md.predictionDeadline))
  }

  async function handleSaveDeadline(md: Matchday) {
    if (!deadlineInput) return
    setSavingDeadline(true)
    try {
      await updateMatchdayDeadline(md.id, new Date(deadlineInput + ':00Z'))
      setEditingDeadline(null)
    } finally {
      setSavingDeadline(false)
    }
  }

  return (
    <>
      <style>{styles}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
            JORNADAS
          </h1>
          {!loading && (
            <span style={{
              background: 'var(--accent-deep)',
              border: '1px solid var(--accent-muted)',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              color: 'var(--accent-light)',
            }}>
              {matchdays.length}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Gestiona el estado y deadline de cada jornada.
        </p>
      </div>

      {/* Pending predictions banner */}
      {!loading && pendingPlayers.length > 0 && (
        <div style={{
          background: 'rgba(250,204,21,0.06)',
          border: '1px solid rgba(250,204,21,0.2)',
          borderLeft: '3px solid rgba(250,204,21,0.5)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ color: 'rgba(250,204,21,0.7)', flexShrink: 0 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,204,21,0.75)' }}>
              Faltan pronósticos — {openMatchdayName}
            </span>
            <span style={{
              background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)',
              borderRadius: 99, padding: '1px 7px', fontSize: '0.62rem',
              color: 'rgba(250,204,21,0.7)', letterSpacing: '0.08em',
            }}>
              {pendingPlayers.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {pendingPlayers.map(p => (
              <div key={p.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {p.displayName || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>sin nombre</span>}
                </span>
                <span style={{
                  fontSize: '0.7rem', flexShrink: 0,
                  color: p.filled === 0 ? 'rgba(239,68,68,0.7)' : 'rgba(250,204,21,0.6)',
                  background: p.filled === 0 ? 'rgba(239,68,68,0.07)' : 'rgba(250,204,21,0.07)',
                  border: `1px solid ${p.filled === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(250,204,21,0.2)'}`,
                  borderRadius: 99, padding: '1px 8px',
                }}>
                  {p.filled === 0 ? 'ninguno' : `${p.filled}/${p.total}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading
          ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
          : matchdays.map(md => (
            <div
              key={md.id}
              className="mdl-card rounded-xl overflow-hidden"
              style={{ borderLeft: `4px solid ${STATUS_BORDER[md.status]}` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontFamily: BEBAS, fontSize: '1.1rem', letterSpacing: '0.06em', color: '#fff' }}>
                      {md.name}
                    </span>
                    <StatusBadge status={md.status} type="matchday" />
                    {md.predictionMode === 'exact_score' && (
                      <span style={{
                        background: 'rgba(250,204,21,0.08)',
                        border: '1px solid rgba(250,204,21,0.22)',
                        borderRadius: 99,
                        padding: '1px 7px',
                        fontSize: '0.58rem',
                        letterSpacing: '0.1em',
                        color: 'rgba(250,204,21,0.65)',
                        textTransform: 'uppercase' as const,
                        whiteSpace: 'nowrap' as const,
                      }}>
                        Marcador exacto
                      </span>
                    )}
                  </div>

                  {editingDeadline === md.id ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="datetime-local"
                        value={deadlineInput}
                        onChange={e => setDeadlineInput(e.target.value)}
                        className="mdl-input text-xs px-2 py-1 rounded-lg"
                      />
                      <button
                        onClick={() => handleSaveDeadline(md)}
                        disabled={savingDeadline || !deadlineInput}
                        className="mdl-btn-primary text-xs px-2.5 py-1 rounded-lg"
                      >
                        {savingDeadline ? '···' : 'OK'}
                      </button>
                      <button
                        onClick={() => setEditingDeadline(null)}
                        disabled={savingDeadline}
                        className="mdl-btn-ghost text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                        Deadline:
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                        {formatDate(md.predictionDeadline, timezone)}
                      </span>
                      <button
                        onClick={() => startEditDeadline(md)}
                        style={{
                          fontSize: '0.65rem',
                          color: 'rgba(255,255,255,0.22)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 2px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-light)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}
                      >
                        ✏ editar
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/admin/jornada/${md.id}`}
                    className="mdl-btn-secondary text-sm px-3 py-1.5 rounded-lg"
                  >
                    Ver partidos
                  </Link>
                  <button
                    onClick={() => handleStatusChange(md)}
                    disabled={updating === md.id}
                    className="mdl-btn-primary text-sm px-3 py-1.5 rounded-lg"
                  >
                    {updating === md.id ? '···' : STATUS_CYCLE_LABEL[md.status]}
                  </button>
                </div>

              </div>
            </div>
          ))
        }
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes mdl-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .mdl-card {
    background: var(--surface-card);
    border-top: 1px solid rgba(255,255,255,0.05);
    border-right: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.15s ease;
    position: relative;
  }
  .mdl-card:hover {
    background: rgba(255,255,255,0.025);
  }

  .mdl-skeleton {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    position: relative;
    animation: mdl-shimmer 1.6s ease-in-out infinite;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.02) 25%,
      rgba(255,255,255,0.05) 50%,
      rgba(255,255,255,0.02) 75%
    );
    background-size: 800px 100%;
  }

  .mdl-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    color: white;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .mdl-input:focus { border-color: var(--accent); }
  .mdl-input::-webkit-calendar-picker-indicator { filter: invert(0.5); }

  .mdl-btn-primary {
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .mdl-btn-primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .mdl-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .mdl-btn-secondary {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .mdl-btn-secondary:hover {
    background: rgba(255,255,255,0.08);
    color: white;
  }

  .mdl-btn-ghost {
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    transition: color 0.15s ease;
    font-size: 0.75rem;
    padding: 0 4px;
  }
  .mdl-btn-ghost:hover:not(:disabled) { color: rgba(255,255,255,0.7); }
  .mdl-btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }
`

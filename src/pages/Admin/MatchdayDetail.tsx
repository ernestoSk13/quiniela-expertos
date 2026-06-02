import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { useMatchdays } from '@/hooks/useMatchdays'
import { useMatchesByMatchday } from '@/hooks/useMatches'
import { useTeamsMap } from '@/hooks/useTeams'
import { saveMatchResult, clearMatchResult, updateMatchDetails } from '@/services/firestoreMatches'
import StatusBadge from '@/components/StatusBadge'
import type { Match } from '@/types'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResultEditState {
  homeScore: string
  awayScore: string
  winner: string
}

interface DetailsEditState {
  homeTeamCode: string
  awayTeamCode: string
  scheduledAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDatetimeLocal(ts: Match['scheduledAt']): string {
  if (!ts) return ''
  const d = ts.toDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

function formatTime(ts: Match['scheduledAt'], timezone: string) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }) ?? '—'
}

function groupMatchesByGroup(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((acc, m) => {
    const g = m.group ?? 'Eliminatoria'
    acc[g] = [...(acc[g] ?? []), m]
    return acc
  }, {})
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonGroup() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="mdd-shimmer" style={{ height: 12, width: 80, borderRadius: 4, marginBottom: 10 }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="mdd-shimmer" style={{ height: 58, borderRadius: 12, marginBottom: 6 }} />
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MatchdayDetail() {
  const { matchdayId } = useParams<{ matchdayId: string }>()
  const { matchdays } = useMatchdays()
  const { matches, loading } = useMatchesByMatchday(matchdayId ?? '')
  const { teamsMap } = useTeamsMap()
  const timezone = useUserTimezone()

  const [resultEditId, setResultEditId] = useState<string | null>(null)
  const [resultState, setResultState] = useState<ResultEditState>({ homeScore: '', awayScore: '', winner: '' })
  const [savingResult, setSavingResult] = useState(false)

  const [detailsEditId, setDetailsEditId] = useState<string | null>(null)
  const [detailsState, setDetailsState] = useState<DetailsEditState>({ homeTeamCode: '', awayTeamCode: '', scheduledAt: '' })
  const [savingDetails, setSavingDetails] = useState(false)

  const matchday = matchdays.find(md => md.id === matchdayId)
  const grouped = groupMatchesByGroup(matches)
  const teamsList = Object.values(teamsMap).sort((a, b) =>
    (a.group ?? '').localeCompare(b.group ?? '') || a.name.localeCompare(b.name)
  )

  // ── Result handlers ──

  function startResultEdit(match: Match) {
    setDetailsEditId(null)
    setResultEditId(match.id)
    setResultState({
      homeScore: match.homeScore !== null ? String(match.homeScore) : '',
      awayScore: match.awayScore !== null ? String(match.awayScore) : '',
      winner: match.winner ?? '',
    })
  }

  function cancelResultEdit() {
    setResultEditId(null)
    setResultState({ homeScore: '', awayScore: '', winner: '' })
  }

  async function handleResultSave(match: Match) {
    const home = parseInt(resultState.homeScore)
    const away = parseInt(resultState.awayScore)
    if (isNaN(home) || isNaN(away)) return

    const isKnockout = match.phase !== 'group_stage'
    let winner: string | null = null
    if (isKnockout) {
      winner = home !== away
        ? (home > away ? match.homeTeamCode : match.awayTeamCode)
        : resultState.winner || null
      if (isKnockout && home === away && !winner) return
    }

    setSavingResult(true)
    try {
      await saveMatchResult(match.id, home, away, winner)
      cancelResultEdit()
    } finally {
      setSavingResult(false)
    }
  }

  // ── Details handlers ──

  function startDetailsEdit(match: Match) {
    setResultEditId(null)
    setDetailsEditId(match.id)
    setDetailsState({
      homeTeamCode: match.homeTeamCode,
      awayTeamCode: match.awayTeamCode,
      scheduledAt: toDatetimeLocal(match.scheduledAt),
    })
  }

  function cancelDetailsEdit() {
    setDetailsEditId(null)
    setDetailsState({ homeTeamCode: '', awayTeamCode: '', scheduledAt: '' })
  }

  async function handleDetailsSave(match: Match) {
    const { homeTeamCode, awayTeamCode, scheduledAt } = detailsState
    if (!homeTeamCode || !awayTeamCode || !scheduledAt) return
    if (homeTeamCode === awayTeamCode) return

    setSavingDetails(true)
    try {
      await updateMatchDetails(match.id, {
        homeTeamCode,
        homeTeam: teamsMap[homeTeamCode]?.name ?? homeTeamCode,
        awayTeamCode,
        awayTeam: teamsMap[awayTeamCode]?.name ?? awayTeamCode,
        scheduledAt: new Date(scheduledAt + ':00Z'),
      })
      cancelDetailsEdit()
    } finally {
      setSavingDetails(false)
    }
  }

  const flag = (code: string) => teamsMap[code]?.flag ?? '🏳️'
  const isTie = parseInt(resultState.homeScore) === parseInt(resultState.awayScore)

  return (
    <>
      <style>{styles}</style>

      {/* Breadcrumb + page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Link
            to="/admin"
            style={{
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.3)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent-light)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.3)' }}
          >
            ← JORNADAS
          </Link>
          {matchday && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.8rem' }}>/</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: BEBAS, fontSize: '1.3rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
                  {matchday.name}
                </h1>
                <StatusBadge status={matchday.status} type="matchday" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div>
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {Object.entries(grouped).sort().map(([group, groupMatches]) => (
            <div key={group}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{
                  fontFamily: BEBAS,
                  fontSize: '1rem',
                  letterSpacing: '0.14em',
                  color: 'var(--accent)',
                }}>
                  GRUPO {group}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
                  {groupMatches.length} PARTIDOS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groupMatches.map(match => (
                  <div key={match.id} className="mdd-card rounded-xl overflow-hidden">

                    {resultEditId === match.id ? (
                      /* ── Result edit mode ── */
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>{match.homeTeam}</span>
                            <span style={{ fontSize: '1.4rem' }}>{flag(match.homeTeamCode)}</span>
                            <input
                              type="number" min="0" max="99"
                              value={resultState.homeScore}
                              onChange={e => setResultState(s => ({ ...s, homeScore: e.target.value }))}
                              className="mdd-score-input"
                            />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: BEBAS, fontSize: '1.2rem' }}>VS</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <input
                              type="number" min="0" max="99"
                              value={resultState.awayScore}
                              onChange={e => setResultState(s => ({ ...s, awayScore: e.target.value }))}
                              className="mdd-score-input"
                            />
                            <span style={{ fontSize: '1.4rem' }}>{flag(match.awayTeamCode)}</span>
                            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>{match.awayTeam}</span>
                          </div>
                        </div>

                        {match.phase !== 'group_stage' && isTie && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>¿Quién avanza?</span>
                            <select
                              value={resultState.winner}
                              onChange={e => setResultState(s => ({ ...s, winner: e.target.value }))}
                              className="mdd-select"
                            >
                              <option value="">Seleccionar…</option>
                              <option value={match.homeTeamCode}>{flag(match.homeTeamCode)} {match.homeTeam}</option>
                              <option value={match.awayTeamCode}>{flag(match.awayTeamCode)} {match.awayTeam}</option>
                            </select>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={cancelResultEdit} className="mdd-btn-secondary text-sm px-3 py-1.5 rounded-lg">
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleResultSave(match)}
                            disabled={savingResult || !resultState.homeScore || !resultState.awayScore}
                            className="mdd-btn-primary text-sm px-3 py-1.5 rounded-lg"
                          >
                            {savingResult ? 'Guardando…' : 'Guardar resultado'}
                          </button>
                        </div>
                      </div>

                    ) : detailsEditId === match.id ? (
                      /* ── Details edit mode ── */
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                              Local
                            </label>
                            <select
                              value={detailsState.homeTeamCode}
                              onChange={e => setDetailsState(s => ({ ...s, homeTeamCode: e.target.value }))}
                              className="mdd-select w-full"
                            >
                              <option value="">Seleccionar…</option>
                              {teamsList.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.flag} {t.name} ({t.group ?? '—'})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                              Visitante
                            </label>
                            <select
                              value={detailsState.awayTeamCode}
                              onChange={e => setDetailsState(s => ({ ...s, awayTeamCode: e.target.value }))}
                              className="mdd-select w-full"
                            >
                              <option value="">Seleccionar…</option>
                              {teamsList.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.flag} {t.name} ({t.group ?? '—'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Fecha y hora (UTC)
                          </label>
                          <input
                            type="datetime-local"
                            value={detailsState.scheduledAt}
                            onChange={e => setDetailsState(s => ({ ...s, scheduledAt: e.target.value }))}
                            className="mdd-input w-full"
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={cancelDetailsEdit} className="mdd-btn-secondary text-sm px-3 py-1.5 rounded-lg">
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDetailsSave(match)}
                            disabled={savingDetails || !detailsState.homeTeamCode || !detailsState.awayTeamCode || !detailsState.scheduledAt}
                            className="mdd-btn-primary text-sm px-3 py-1.5 rounded-lg"
                          >
                            {savingDetails ? 'Guardando…' : 'Guardar cambios'}
                          </button>
                        </div>
                      </div>

                    ) : (
                      /* ── Display mode ── */
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>

                        {/* Home team */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:block">
                            {match.homeTeam}
                          </span>
                          <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{flag(match.homeTeamCode)}</span>
                        </div>

                        {/* Score / Time */}
                        <div style={{
                          flexShrink: 0,
                          textAlign: 'center',
                          minWidth: 80,
                          padding: '0 8px',
                          borderLeft: '1px solid rgba(255,255,255,0.06)',
                          borderRight: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          {match.status === 'finished' ? (
                            <span style={{ fontFamily: BEBAS, fontSize: '1.6rem', letterSpacing: '0.06em', color: '#fff', lineHeight: 1 }}>
                              {match.homeScore} – {match.awayScore}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                              {formatTime(match.scheduledAt, timezone)}
                            </span>
                          )}
                          {match.winner && (
                            <div style={{ fontSize: '0.62rem', color: 'var(--accent-light)', marginTop: 2, letterSpacing: '0.04em' }}>
                              Avanza: {flag(match.winner)}
                            </div>
                          )}
                        </div>

                        {/* Away team */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{flag(match.awayTeamCode)}</span>
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:block">
                            {match.awayTeam}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => startDetailsEdit(match)}
                            title="Editar equipos y horario"
                            className="mdd-icon-btn"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => startResultEdit(match)}
                            className="mdd-btn-secondary text-xs px-2.5 py-1 rounded-lg"
                          >
                            {match.status === 'finished' ? 'Editar' : 'Resultado'}
                          </button>
                          {match.status === 'finished' && (
                            <button
                              onClick={() => clearMatchResult(match.id)}
                              className="mdd-btn-danger text-xs px-2 py-1 rounded-lg"
                              title="Borrar resultado"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes mdd-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .mdd-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 800px 100%;
    animation: mdd-shimmer 1.6s ease-in-out infinite;
  }

  .mdd-card {
    background: var(--surface-card);
    border: 1px solid rgba(255,255,255,0.05);
    transition: border-color 0.15s ease;
  }
  .mdd-card:hover { border-color: rgba(255,255,255,0.09); }

  .mdd-score-input {
    width: 52px;
    text-align: center;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 10px;
    padding: 6px 4px;
    color: white;
    font-family: ${BEBAS};
    font-size: 1.3rem;
    letter-spacing: 0.04em;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .mdd-score-input:focus { border-color: var(--accent); }

  .mdd-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 12px;
    color: white;
    font-size: 0.82rem;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .mdd-input:focus { border-color: var(--accent); }
  .mdd-input::-webkit-calendar-picker-indicator { filter: invert(0.4); }

  .mdd-select {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 12px;
    color: white;
    font-size: 0.82rem;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .mdd-select:focus { border-color: var(--accent); }

  .mdd-btn-primary {
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mdd-btn-primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .mdd-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .mdd-btn-secondary {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.55);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mdd-btn-secondary:hover { background: rgba(255,255,255,0.09); color: white; }

  .mdd-btn-danger {
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.2);
    color: rgba(239,68,68,0.5);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mdd-btn-danger:hover { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.4); }

  .mdd-icon-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.15s ease;
  }
  .mdd-icon-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.16); }
`

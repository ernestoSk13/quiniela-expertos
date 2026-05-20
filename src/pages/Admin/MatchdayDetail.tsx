import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMatchdays } from '@/hooks/useMatchdays'
import { useMatchesByMatchday } from '@/hooks/useMatches'
import { useTeamsMap } from '@/hooks/useTeams'
import { saveMatchResult, clearMatchResult, updateMatchDetails } from '@/services/firestoreMatches'
import StatusBadge from '@/components/StatusBadge'
import type { Match } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResultEditState {
  homeScore: string
  awayScore: string
  winner: string
}

interface DetailsEditState {
  homeTeamCode: string
  awayTeamCode: string
  scheduledAt: string // formato datetime-local
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDatetimeLocal(ts: Match['scheduledAt']): string {
  if (!ts) return ''
  const d = ts.toDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

function formatTime(ts: Match['scheduledAt']) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

function groupMatchesByGroup(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((acc, m) => {
    const g = m.group ?? 'Eliminatoria'
    acc[g] = [...(acc[g] ?? []), m]
    return acc
  }, {})
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MatchdayDetail() {
  const { matchdayId } = useParams<{ matchdayId: string }>()
  const { matchdays } = useMatchdays()
  const { matches, loading } = useMatchesByMatchday(matchdayId ?? '')
  const { teamsMap } = useTeamsMap()

  // Result edit state
  const [resultEditId, setResultEditId] = useState<string | null>(null)
  const [resultState, setResultState] = useState<ResultEditState>({ homeScore: '', awayScore: '', winner: '' })
  const [savingResult, setSavingResult] = useState(false)

  // Details edit state
  const [detailsEditId, setDetailsEditId] = useState<string | null>(null)
  const [detailsState, setDetailsState] = useState<DetailsEditState>({ homeTeamCode: '', awayTeamCode: '', scheduledAt: '' })
  const [savingDetails, setSavingDetails] = useState(false)

  const matchday = matchdays.find(md => md.id === matchdayId)
  const grouped = groupMatchesByGroup(matches)
  const teamsList = Object.values(teamsMap).sort((a, b) =>
    (a.group ?? '').localeCompare(b.group ?? '') || a.name.localeCompare(b.name)
  )

  // ── Result edit handlers ──

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

  // ── Details edit handlers ──

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

  if (loading) return <p className="text-gray-500">Cargando partidos...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Jornadas
        </Link>
        {matchday && (
          <>
            <span className="text-gray-700">/</span>
            <h1 className="font-bold">{matchday.name}</h1>
            <StatusBadge status={matchday.status} type="matchday" />
          </>
        )}
      </div>

      {/* Matches */}
      <div className="space-y-6">
        {Object.entries(grouped).sort().map(([group, groupMatches]) => (
          <div key={group}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Grupo {group}
            </h2>
            <div className="space-y-2">
              {groupMatches.map(match => (
                <div key={match.id} className="surface-card border border-gray-800 rounded-xl p-4">

                  {resultEditId === match.id ? (
                    /* ── Result edit mode ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-sm font-medium">{match.homeTeam}</span>
                          <span>{flag(match.homeTeamCode)}</span>
                          <input
                            type="number" min="0" max="99"
                            value={resultState.homeScore}
                            onChange={e => setResultState(s => ({ ...s, homeScore: e.target.value }))}
                            className="w-14 text-center bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none rounded-lg py-1.5 text-white font-bold text-lg"
                          />
                        </div>
                        <span className="text-gray-500 font-bold">vs</span>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number" min="0" max="99"
                            value={resultState.awayScore}
                            onChange={e => setResultState(s => ({ ...s, awayScore: e.target.value }))}
                            className="w-14 text-center bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none rounded-lg py-1.5 text-white font-bold text-lg"
                          />
                          <span>{flag(match.awayTeamCode)}</span>
                          <span className="text-sm font-medium">{match.awayTeam}</span>
                        </div>
                      </div>

                      {match.phase !== 'group_stage' && isTie && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">¿Quién avanza?</span>
                          <select
                            value={resultState.winner}
                            onChange={e => setResultState(s => ({ ...s, winner: e.target.value }))}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                          >
                            <option value="">Seleccionar…</option>
                            <option value={match.homeTeamCode}>{flag(match.homeTeamCode)} {match.homeTeam}</option>
                            <option value={match.awayTeamCode}>{flag(match.awayTeamCode)} {match.awayTeam}</option>
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelResultEdit} className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleResultSave(match)}
                          disabled={savingResult || !resultState.homeScore || !resultState.awayScore}
                          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-hover)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
                        >
                          {savingResult ? 'Guardando…' : 'Guardar resultado'}
                        </button>
                      </div>
                    </div>

                  ) : detailsEditId === match.id ? (
                    /* ── Details edit mode ── */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Local</label>
                          <select
                            value={detailsState.homeTeamCode}
                            onChange={e => setDetailsState(s => ({ ...s, homeTeamCode: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
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
                          <label className="block text-xs text-gray-500 mb-1">Visitante</label>
                          <select
                            value={detailsState.awayTeamCode}
                            onChange={e => setDetailsState(s => ({ ...s, awayTeamCode: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
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
                        <label className="block text-xs text-gray-500 mb-1">Fecha y hora (hora local)</label>
                        <input
                          type="datetime-local"
                          value={detailsState.scheduledAt}
                          onChange={e => setDetailsState(s => ({ ...s, scheduledAt: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelDetailsEdit} className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleDetailsSave(match)}
                          disabled={savingDetails || !detailsState.homeTeamCode || !detailsState.awayTeamCode || !detailsState.scheduledAt}
                          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-hover)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
                        >
                          {savingDetails ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                      </div>
                    </div>

                  ) : (
                    /* ── Display mode ── */
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-sm font-medium hidden sm:block">{match.homeTeam}</span>
                        <span className="text-lg">{flag(match.homeTeamCode)}</span>
                      </div>

                      <div className="text-center min-w-[72px]">
                        {match.status === 'finished' ? (
                          <span className="font-bold text-lg">{match.homeScore} – {match.awayScore}</span>
                        ) : (
                          <span className="text-xs text-gray-500">{formatTime(match.scheduledAt)}</span>
                        )}
                        {match.winner && (
                          <p className="text-xs text-[var(--accent-light)] mt-0.5">
                            Avanza: {flag(match.winner)} {teamsMap[match.winner]?.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{flag(match.awayTeamCode)}</span>
                        <span className="text-sm font-medium hidden sm:block">{match.awayTeam}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => startDetailsEdit(match)}
                          title="Editar equipos y horario"
                          className="px-2.5 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => startResultEdit(match)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          {match.status === 'finished' ? 'Editar' : 'Resultado'}
                        </button>
                        {match.status === 'finished' && (
                          <button
                            onClick={() => clearMatchResult(match.id)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-400 transition-colors"
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
    </div>
  )
}

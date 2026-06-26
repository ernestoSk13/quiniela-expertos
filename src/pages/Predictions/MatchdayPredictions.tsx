import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMatchday } from '@/hooks/useMatchdays'
import { useMatchesByMatchday } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useTeamsMap } from '@/hooks/useTeams'
import { savePredictions } from '@/services/firestorePredictions'
import PostMatchdayView from './PostMatchdayView'
import JornadaShareCard from './JornadaShareCard'
import ResultPicker from './ResultPicker'
import ScorePicker from './ScorePicker'
import { useTheme } from '@/context/ThemeContext'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import type { PredictionResult } from '@/types'

type LocalPred = {
  result: PredictionResult | null
  tieWinner: string | null
  homeGoals: number | null
  awayGoals: number | null
}

function deriveResult(home: number, away: number): PredictionResult {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

function formatDeadline(ts: any, timezone: string) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }) ?? '—'
}

function formatMatchTime(ts: any, timezone: string) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }) ?? null
}

const PREDICTION_CUTOFF_MS = 10 * 60 * 1000

function matchDeadlineDate(ts: any): Date | null {
  if (!ts) return null
  return new Date(ts.toDate().getTime() - PREDICTION_CUTOFF_MS)
}

export default function MatchdayPredictions() {
  const { matchdayId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { matchday, loading: mdLoading } = useMatchday(matchdayId)
  const { matches, loading: matchesLoading } = useMatchesByMatchday(matchdayId)
  const { predictions, loading: predsLoading, refresh: refreshPredictions } = usePredictions(user?.uid ?? '', matchdayId)
  const { teamsMap } = useTeamsMap()

  const [preds, setPreds] = useState<Record<string, LocalPred>>({})
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine')
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const { themeId } = useTheme()
  const timezone = useUserTimezone()

  const isExactMode = matchday?.predictionMode === 'exact_score'
  const isOpen = matchday?.status === 'open'
  const deadlinePassed = matchday?.predictionDeadline
    ? new Date() > matchday.predictionDeadline.toDate()
    : false
  const readOnly = !isOpen || deadlinePassed
  const canViewAll = matchday?.status === 'closed' || matchday?.status === 'finished'

  useEffect(() => {
    if (predsLoading) return
    const init: Record<string, LocalPred> = {}
    for (const [matchId, p] of Object.entries(predictions)) {
      init[matchId] = {
        result: p.result,
        tieWinner: p.tieWinner,
        homeGoals: p.homeGoals ?? null,
        awayGoals: p.awayGoals ?? null,
      }
    }
    setPreds(init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predsLoading])

  const doSave = useCallback(async (matchId: string, updated: LocalPred) => {
    if (!user || readOnly) return
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    if (match.scheduledAt && matchDeadlineDate(match.scheduledAt)! <= new Date()) return
    const isKnockout = match.phase !== 'group_stage'

    if (isExactMode) {
      if (updated.homeGoals === null || updated.awayGoals === null) return
      if (isKnockout && updated.result === 'draw' && !updated.tieWinner) return
    } else {
      if (!updated.result) return
      if (isKnockout && updated.result === 'draw' && !updated.tieWinner) return
    }

    setSavingMatchId(matchId)
    try {
      await savePredictions(user.uid, [{
        matchId,
        matchdayId,
        result: updated.result!,
        tieWinner: updated.tieWinner,
        homeGoals: updated.homeGoals,
        awayGoals: updated.awayGoals,
      }], predictions)
      await refreshPredictions()
    } finally {
      setSavingMatchId(null)
    }
  }, [user, readOnly, matches, matchdayId, predictions, refreshPredictions, isExactMode])

  function scheduleSave(matchId: string, updated: LocalPred) {
    clearTimeout(debounceTimers.current[matchId])
    debounceTimers.current[matchId] = setTimeout(() => doSave(matchId, updated), 400)
  }

  function handleResult(matchId: string, result: PredictionResult) {
    const updated: LocalPred = {
      result,
      tieWinner: preds[matchId]?.tieWinner ?? null,
      homeGoals: null,
      awayGoals: null,
    }
    setPreds(prev => ({ ...prev, [matchId]: updated }))
    scheduleSave(matchId, updated)
  }

  function handleScore(matchId: string, homeGoals: number, awayGoals: number) {
    const result = deriveResult(homeGoals, awayGoals)
    const updated: LocalPred = {
      result,
      tieWinner: preds[matchId]?.tieWinner ?? null,
      homeGoals,
      awayGoals,
    }
    setPreds(prev => ({ ...prev, [matchId]: updated }))
    scheduleSave(matchId, updated)
  }

  function handleTieWinner(matchId: string, code: string) {
    const updated: LocalPred = { ...preds[matchId], tieWinner: code }
    setPreds(prev => ({ ...prev, [matchId]: updated }))
    scheduleSave(matchId, updated)
  }

  const dirtyMatchIds = useMemo(() => {
    return matches
      .filter(m => {
        const s = preds[m.id]
        const p = predictions[m.id]
        if (isExactMode) {
          if (s?.homeGoals == null || s?.awayGoals == null) return false
          if (!p) return true
          return s.homeGoals !== (p.homeGoals ?? null) ||
                 s.awayGoals !== (p.awayGoals ?? null) ||
                 s.tieWinner !== p.tieWinner
        } else {
          if (!s?.result) return false
          if (!p) return true
          return s.result !== p.result || s.tieWinner !== p.tieWinner
        }
      })
      .map(m => m.id)
  }, [preds, predictions, matches, isExactMode])

  const isObserver = user?.role === 'observer'
  const loading = mdLoading || matchesLoading || predsLoading

  if (loading) {
    return (
      <div className="min-h-screen app-bg text-white flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!matchday) {
    return (
      <div className="min-h-screen app-bg text-white flex items-center justify-center">
        <p className="text-gray-500">Jornada no encontrada.</p>
      </div>
    )
  }

  if (isObserver) {
    return (
      <div className="min-h-screen app-bg text-white flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">👁️</span>
        <h2 className="font-bold text-lg" style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.1em' }}>
          Modo Observador
        </h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Puedes ver la quiniela, pero los observadores no participan en pronósticos ni en la tabla general.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-2 text-xs text-gray-500 hover:text-white transition-colors"
        >
          ← Volver al dashboard
        </button>
      </div>
    )
  }

  const savedCount = matches.filter(m => {
    const p = predictions[m.id]
    if (!p) return false
    if (isExactMode) return p.homeGoals != null && p.awayGoals != null
    return p.result != null
  }).length

  return (
    <div className="min-h-screen app-bg text-white">
      {/* Header */}
      <header className="border-b border-gray-800 surface-nav sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none shrink-0"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{matchday.name}</p>
            {!readOnly && (
              <p className="text-xs text-gray-500 truncate">
                Cierra: {formatDeadline(matchday.predictionDeadline, timezone)}
              </p>
            )}
          </div>
          {isExactMode && (
            <span className="text-xs shrink-0" style={{
              background: 'rgba(250,204,21,0.08)',
              border: '1px solid rgba(250,204,21,0.2)',
              borderRadius: 99,
              padding: '2px 8px',
              color: 'rgba(250,204,21,0.7)',
              letterSpacing: '0.06em',
            }}>
              Marcador exacto
            </span>
          )}
          {readOnly && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full shrink-0">
              {deadlinePassed ? 'Cerrado' : matchday.status === 'upcoming' ? 'No disponible' : 'Finalizado'}
            </span>
          )}
        </div>
      </header>

      {/* Progress bar (edit mode only) */}
      {!readOnly && (
        <div className="sticky top-14 z-10 border-b border-gray-800 surface-nav">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Pronósticos: <span className="text-white font-semibold">{savedCount}/{matches.length}</span>
            </span>
            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: matches.length > 0 ? `${(savedCount / matches.length) * 100}%` : '0%',
                  background: 'var(--accent)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View toggle — only for closed/finished matchdays */}
      {canViewAll && (
        <div className="border-b border-gray-800 surface-nav sticky top-14 z-10">
          <div className="max-w-5xl mx-auto px-4 flex items-center">
            <div className="flex gap-1 flex-1">
              {(['mine', 'all'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === mode
                      ? 'border-[var(--accent)] text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {mode === 'mine' ? 'Mis pronósticos' : 'Ver todos'}
                </button>
              ))}
            </div>
            {viewMode === 'mine' && (
              <JornadaShareCard
                matchdayName={matchday.name}
                matches={matches}
                predictions={predictions}
                themeId={themeId}
              />
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-5xl mx-auto px-3 py-3 md:px-4 md:py-4">
        {viewMode === 'all' ? (
          <PostMatchdayView
            matchdayId={matchdayId}
            matches={matches}
            teamsMap={teamsMap}
            predictionMode={matchday.predictionMode}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {matches.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No hay partidos en esta jornada.</p>
            )}
            {matches.map(match => {
              const s = preds[match.id]
              const saved = predictions[match.id]
              const deadline = matchDeadlineDate(match.scheduledAt)
              const matchStarted = deadline ? deadline <= new Date() : false
              const matchReadOnly = readOnly || matchStarted
              const homeFlag = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const awayFlag = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
              const isKnockout = match.phase !== 'group_stage'
              const isDirty = dirtyMatchIds.includes(match.id)
              const isSaving = savingMatchId === match.id
              const isSaved = !!saved && !isDirty && !isSaving

              return (
                <div
                  key={match.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--surface-card)',
                    border: isSaved
                      ? '1px solid rgba(var(--accent-rgb, 0,200,83), 0.25)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Match header */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <span className="text-lg">{homeFlag}</span>
                    <span className="text-xs font-bold tracking-widest text-white/70 uppercase flex-1">
                      {match.homeTeamCode}
                    </span>
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <span className="text-xs text-white/30 tracking-widest">vs</span>
                      {match.scheduledAt && (
                        <span className="text-[10px] tabular-nums whitespace-nowrap" style={{ color: matchReadOnly ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.25)' }}>
                          {matchReadOnly
                            ? `⛔ ${formatMatchTime(match.scheduledAt, timezone)}`
                            : `⏱ cierre ${formatMatchTime({ toDate: () => matchDeadlineDate(match.scheduledAt)! }, timezone)}`
                          }
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold tracking-widest text-white/70 uppercase flex-1 text-right">
                      {match.awayTeamCode}
                    </span>
                    <span className="text-lg">{awayFlag}</span>
                    {isSaving && (
                      <span className="text-[10px] text-white/30 ml-1 animate-pulse">●</span>
                    )}
                    {isSaved && !isSaving && (
                      <span className="text-[10px] text-green-400 ml-1">✓</span>
                    )}
                  </div>

                  {/* Picker — result mode or exact score mode */}
                  {isExactMode ? (
                    <ScorePicker
                      homeGoals={s?.homeGoals ?? null}
                      awayGoals={s?.awayGoals ?? null}
                      savedHomeGoals={saved?.homeGoals ?? null}
                      savedAwayGoals={saved?.awayGoals ?? null}
                      disabled={matchReadOnly}
                      onChange={(h, a) => handleScore(match.id, h, a)}
                    />
                  ) : (
                    <ResultPicker
                      value={s?.result ?? null}
                      savedValue={saved?.result ?? null}
                      disabled={matchReadOnly}
                      onChange={result => handleResult(match.id, result)}
                    />
                  )}

                  {/* Tie winner — knockout + draw */}
                  {isKnockout && s?.result === 'draw' && !matchReadOnly && (
                    <div className="px-3 pb-3">
                      <p className="text-xs text-white/40 mb-2">¿Quién pasa?</p>
                      <div className="flex gap-2">
                        {[
                          { code: match.homeTeamCode, flag: homeFlag },
                          { code: match.awayTeamCode, flag: awayFlag },
                        ].map(({ code, flag }) => (
                          <button
                            key={code}
                            onClick={() => handleTieWinner(match.id, code)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all"
                            style={{
                              background: s.tieWinner === code ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                              color: s.tieWinner === code ? '#000' : 'rgba(255,255,255,0.5)',
                              border: s.tieWinner === code ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {flag} {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMatchday } from '@/hooks/useMatchdays'
import { useMatchesByMatchday } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useTeamsMap } from '@/hooks/useTeams'
import { savePredictions, type PredictionDraft } from '@/services/firestorePredictions'
import PostMatchdayView from './PostMatchdayView'
import JornadaShareCard from './JornadaShareCard'
import { useTheme } from '@/context/ThemeContext'
import type { PredictionResult } from '@/types'

type LocalPred = { result: PredictionResult | null; tieWinner: string | null }

function formatDeadline(ts: any) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

function resultLabel(r: PredictionResult): string {
  if (r === 'home') return 'LOCAL'
  if (r === 'draw') return 'EMPATE'
  return 'VISITANTE'
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
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine')

  const { themeId } = useTheme()

  const isOpen = matchday?.status === 'open'
  const deadlinePassed = matchday?.predictionDeadline
    ? new Date() > matchday.predictionDeadline.toDate()
    : false
  const readOnly = !isOpen || deadlinePassed
  const canViewAll = matchday?.status === 'closed' || matchday?.status === 'finished'

  // Initialize local state from saved predictions
  useEffect(() => {
    if (predsLoading) return
    const init: Record<string, LocalPred> = {}
    for (const [matchId, p] of Object.entries(predictions)) {
      init[matchId] = { result: p.result, tieWinner: p.tieWinner }
    }
    setPreds(init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predsLoading])

  function handleResult(matchId: string, result: PredictionResult) {
    setPreds(prev => ({
      ...prev,
      [matchId]: { result, tieWinner: prev[matchId]?.tieWinner ?? null },
    }))
  }

  function handleTieWinner(matchId: string, code: string) {
    setPreds(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], tieWinner: code },
    }))
  }

  const dirtyMatchIds = useMemo(() => {
    return matches
      .filter(m => {
        const s = preds[m.id]
        if (!s?.result) return false
        const p = predictions[m.id]
        if (!p) return true
        return s.result !== p.result || s.tieWinner !== p.tieWinner
      })
      .map(m => m.id)
  }, [preds, predictions, matches])

  async function handleSave(matchId: string) {
    if (!user || readOnly) return
    const s = preds[matchId]
    if (!s?.result) return
    const match = matches.find(m => m.id === matchId)
    if (!match) return
    if (match.scheduledAt && match.scheduledAt.toDate() <= new Date()) return
    const isKnockout = match.phase !== 'group_stage'
    if (isKnockout && s.result === 'draw' && !s.tieWinner) return

    const draft: PredictionDraft = {
      matchId,
      matchdayId,
      result: s.result,
      tieWinner: s.tieWinner,
    }
    setSaving(true)
    try {
      await savePredictions(user.uid, [draft], predictions)
      await refreshPredictions()
    } finally {
      setSaving(false)
    }
  }

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

  const savedCount = matches.filter(m => predictions[m.id]).length

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
                Cierra: {formatDeadline(matchday.predictionDeadline)}
              </p>
            )}
          </div>
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
          <PostMatchdayView matchdayId={matchdayId} matches={matches} teamsMap={teamsMap} />
        ) : (
          <div className="flex flex-col gap-2">
            {matches.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No hay partidos en esta jornada.</p>
            )}
            {matches.map(match => {
              const s = preds[match.id]
              const saved = predictions[match.id]
              const matchStarted = match.scheduledAt ? match.scheduledAt.toDate() <= new Date() : false
              const matchReadOnly = readOnly || matchStarted
              const homeFlag = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const awayFlag = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
              const isKnockout = match.phase !== 'group_stage'
              const isDirty = dirtyMatchIds.includes(match.id)
              const isSaved = !!saved && !isDirty

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
                    <span className="text-xs text-white/30 tracking-widest">vs</span>
                    <span className="text-xs font-bold tracking-widest text-white/70 uppercase flex-1 text-right">
                      {match.awayTeamCode}
                    </span>
                    <span className="text-lg">{awayFlag}</span>
                    {isSaved && (
                      <span className="text-[10px] text-green-400 ml-1">✓</span>
                    )}
                  </div>

                  {/* Result picker */}
                  <div className="px-3 py-3 flex gap-2">
                    {(['home', 'draw', 'away'] as PredictionResult[]).map(opt => {
                      const isActive = s?.result === opt
                      const wasSaved = saved?.result === opt
                      return (
                        <button
                          key={opt}
                          disabled={matchReadOnly}
                          onClick={() => handleResult(match.id, opt)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                          style={{
                            background: isActive
                              ? 'var(--accent)'
                              : wasSaved && matchReadOnly
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(255,255,255,0.04)',
                            color: isActive
                              ? '#000'
                              : wasSaved && matchReadOnly
                              ? 'rgba(255,255,255,0.7)'
                              : 'rgba(255,255,255,0.35)',
                            border: isActive
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.08)',
                            cursor: matchReadOnly ? 'default' : 'pointer',
                            opacity: matchReadOnly && !wasSaved && !isActive ? 0.4 : 1,
                          }}
                        >
                          {resultLabel(opt)}
                        </button>
                      )
                    })}
                  </div>

                  {/* Tie winner — knockout + draw selected */}
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

                  {/* Save button — shown when dirty and not read-only */}
                  {isDirty && !matchReadOnly && (
                    <div className="px-3 pb-3">
                      <button
                        onClick={() => handleSave(match.id)}
                        disabled={saving || (isKnockout && s?.result === 'draw' && !s?.tieWinner)}
                        className="w-full py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-40"
                        style={{ background: 'var(--accent)', color: '#000' }}
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
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

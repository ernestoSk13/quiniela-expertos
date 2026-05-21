import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMatchday } from '@/hooks/useMatchdays'
import { useMatchesByMatchday } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useTeamsMap } from '@/hooks/useTeams'
import { savePredictions, type PredictionDraft } from '@/services/firestorePredictions'
import CompactMatchRow from './CompactMatchRow'
import NumericKeypad from './NumericKeypad'
import PredictionsSidebar from './PredictionsSidebar'
import PostMatchdayView from './PostMatchdayView'

type SelectedCell = { matchId: string; side: 'home' | 'away' } | null
type LocalScore = { home: number | null; away: number | null; tieWinner: string | null }

function formatDeadline(ts: any) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

export default function MatchdayPredictions() {
  const { matchdayId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { matchday, loading: mdLoading } = useMatchday(matchdayId)
  const { matches, loading: matchesLoading } = useMatchesByMatchday(matchdayId)
  const { predictions, loading: predsLoading, refresh: refreshPredictions } = usePredictions(user?.uid ?? '', matchdayId)
  const { teamsMap } = useTeamsMap()

  const [scores, setScores] = useState<Record<string, LocalScore>>({})
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null)
  const [saving, setSaving] = useState(false)
  const [expandedForEdit, setExpandedForEdit] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine')
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  )

  const isOpen = matchday?.status === 'open'
  const deadlinePassed = matchday?.predictionDeadline
    ? new Date() > matchday.predictionDeadline.toDate()
    : false
  const readOnly = !isOpen || deadlinePassed
  const canViewAll = matchday?.status === 'closed' || matchday?.status === 'finished'

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Initialize local scores from saved predictions once loaded
  useEffect(() => {
    if (predsLoading) return
    const init: Record<string, LocalScore> = {}
    for (const [matchId, p] of Object.entries(predictions)) {
      init[matchId] = { home: p.homeScore, away: p.awayScore, tieWinner: p.tieWinner }
    }
    setScores(init)
    if (!readOnly && matches.length > 0) {
      const firstUnsaved = matches.find(m => !predictions[m.id])
      setSelectedCell({ matchId: (firstUnsaved ?? matches[0]).id, side: 'home' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predsLoading])

  // Mobile: auto-scroll to selected match above the keypad
  useEffect(() => {
    if (!selectedCell || isDesktop) return
    const el = document.querySelector(`[data-match="${selectedCell.matchId}"]`) as HTMLElement | null
    if (!el) return
    const keypadHeight = 210
    const rect = el.getBoundingClientRect()
    const targetScrollTop = window.scrollY + rect.top - (window.innerHeight - keypadHeight - rect.height) / 2
    window.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
  }, [selectedCell?.matchId, isDesktop])

  function getScore(matchId: string, side: 'home' | 'away'): number | null {
    return scores[matchId]?.[side] ?? null
  }

  function updateScore(matchId: string, side: 'home' | 'away', value: number | null) {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] ?? { home: null, away: null, tieWinner: null }),
        [side]: value,
      },
    }))
  }

  function handleDigit(d: number) {
    if (!selectedCell) return
    const { matchId, side } = selectedCell
    const current = getScore(matchId, side)
    let next: number
    if (current === null) next = d
    else if (current < 10) next = current * 10 + d > 99 ? d : current * 10 + d
    else next = d
    updateScore(matchId, side, next)
  }

  function handleDelete() {
    if (!selectedCell) return
    const { matchId, side } = selectedCell
    const current = getScore(matchId, side)
    if (current === null) return
    updateScore(matchId, side, current >= 10 ? Math.floor(current / 10) : null)
  }

  function handleTieWinner(matchId: string, code: string) {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], tieWinner: code },
    }))
  }

  const handleEditSaved = useCallback((matchId: string) => {
    setExpandedForEdit(prev => new Set([...prev, matchId]))
    setSelectedCell({ matchId, side: 'home' })
    setTimeout(() => {
      const el = document.querySelector(`[data-match="${matchId}"]`) as HTMLElement | null
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  const dirtyMatchIds = useMemo(() => {
    return matches
      .filter(m => {
        const s = scores[m.id]
        if (!s || (s.home === null && s.away === null)) return false
        const p = predictions[m.id]
        if (!p) return s.home !== null || s.away !== null
        return s.home !== p.homeScore || s.away !== p.awayScore
      })
      .map(m => m.id)
  }, [scores, predictions, matches])

  const savedMatchIds = useMemo(() =>
    matches
      .filter(m => predictions[m.id] && !dirtyMatchIds.includes(m.id))
      .map(m => m.id),
    [matches, predictions, dirtyMatchIds]
  )

  async function handleSave() {
    if (!user || readOnly) return

    const now = new Date()
    const drafts: PredictionDraft[] = []
    for (const matchId of dirtyMatchIds) {
      const s = scores[matchId]
      if (s.home === null || s.away === null) continue
      const match = matches.find(m => m.id === matchId)
      if (!match) continue
      // No guardar si el partido ya inició
      if (match.scheduledAt && match.scheduledAt.toDate() <= now) continue
      const isKnockout = match.phase !== 'group_stage'
      const isDraw = s.home === s.away
      if (isKnockout && isDraw && !s.tieWinner) continue
      drafts.push({
        matchId,
        matchdayId,
        homeScore: s.home,
        awayScore: s.away,
        tieWinner: s.tieWinner,
      })
    }

    if (drafts.length === 0) return
    setSaving(true)
    try {
      await savePredictions(user.uid, drafts, predictions)
      await refreshPredictions()
      // Collapse matches that were just saved
      const justSaved = new Set(drafts.map(d => d.matchId))
      setExpandedForEdit(prev => {
        const next = new Set(prev)
        for (const id of justSaved) next.delete(id)
        return next
      })
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

  const bottomPadding = readOnly ? 'pb-6' : 'pb-72 md:pb-6'

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
              <p className="text-xs text-gray-500 truncate md:hidden">
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

      {/* View toggle — only for closed/finished matchdays */}
      {canViewAll && (
        <div className="border-b border-gray-800 surface-nav sticky top-14 z-10">
          <div className="max-w-5xl mx-auto px-4 flex gap-1">
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
        </div>
      )}

      {/* Body — single column on mobile, 2/3 + sidebar on desktop */}
      <div className="max-w-5xl mx-auto px-3 py-3 md:px-4 md:py-4">
        {viewMode === 'all' ? (
          <PostMatchdayView matchdayId={matchdayId} matches={matches} teamsMap={teamsMap} />
        ) : (
        <div className="md:grid md:grid-cols-3 md:gap-6">

          {/* Match list */}
          <div className={`md:col-span-2 flex flex-col ${bottomPadding}`}>
            {matches.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No hay partidos en esta jornada.</p>
            )}
            {matches.map(match => {
              const s = scores[match.id]
              const isSaved = savedMatchIds.includes(match.id)
              // Solo colapsar en modo edición (no en readOnly donde no hay sidebar para re-expandir)
              const isCollapsed = !readOnly && isDesktop && isSaved && !expandedForEdit.has(match.id)
              // Bloquear edición si el partido ya inició, independientemente del deadline de la jornada
              const matchStarted = match.scheduledAt ? match.scheduledAt.toDate() <= new Date() : false
              const matchReadOnly = readOnly || matchStarted
              const selectedSide = selectedCell?.matchId === match.id ? selectedCell.side : null
              const homeFlag = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const awayFlag = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'

              return (
                <div
                  key={match.id}
                  data-match={match.id}
                  className="overflow-hidden"
                  style={{
                    maxHeight: isCollapsed ? '0px' : '300px',
                    opacity: isCollapsed ? 0 : 1,
                    marginBottom: isCollapsed ? '0px' : '6px',
                    transition: 'max-height 350ms ease, opacity 250ms ease, margin-bottom 350ms ease',
                  }}
                >
                  <CompactMatchRow
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    homeCode={match.homeTeamCode}
                    awayCode={match.awayTeamCode}
                    homeFlag={homeFlag}
                    awayFlag={awayFlag}
                    homeScore={s?.home ?? null}
                    awayScore={s?.away ?? null}
                    selectedSide={selectedSide}
                    saved={isSaved}
                    isKnockout={match.phase !== 'group_stage'}
                    tieWinner={s?.tieWinner ?? null}
                    readOnly={matchReadOnly}
                    onSelectHome={() => setSelectedCell({ matchId: match.id, side: 'home' })}
                    onSelectAway={() => setSelectedCell({ matchId: match.id, side: 'away' })}
                    onDirectHomeChange={v => updateScore(match.id, 'home', v)}
                    onDirectAwayChange={v => updateScore(match.id, 'away', v)}
                    onSelectTieWinner={code => handleTieWinner(match.id, code)}
                  />
                </div>
              )
            })}
          </div>

          {/* Sticky sidebar — desktop only, edit mode only */}
          {!readOnly && (
            <div className="hidden md:block">
              <div className="sticky top-20">
                <PredictionsSidebar
                  matches={matches}
                  scores={scores}
                  dirtyMatchIds={dirtyMatchIds}
                  savedMatchIds={savedMatchIds}
                  matchday={matchday}
                  teamsMap={teamsMap}
                  saving={saving}
                  onSave={handleSave}
                  onEditSaved={handleEditSaved}
                />
              </div>
            </div>
          )}

        </div>
        )} {/* end viewMode === 'mine' */}
      </div>

      {/* Numeric keypad — hidden in read-only mode */}
      {!readOnly && (
        <NumericKeypad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onSave={handleSave}
          dirtyCount={dirtyMatchIds.length}
          saving={saving}
        />
      )}
    </div>
  )
}

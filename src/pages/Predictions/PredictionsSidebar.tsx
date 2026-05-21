import type { Match, Matchday, Team } from '@/types'

type LocalScore = { home: number | null; away: number | null; tieWinner: string | null }

interface Props {
  matches: Match[]
  scores: Record<string, LocalScore>
  dirtyMatchIds: string[]
  savedMatchIds: string[]
  matchday: Matchday
  teamsMap: Record<string, Team>
  saving: boolean
  onSave: () => void
  onEditSaved: (matchId: string) => void
}

function formatDeadline(ts: any) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

export default function PredictionsSidebar({
  matches, scores, dirtyMatchIds, savedMatchIds, matchday, teamsMap, saving, onSave, onEditSaved,
}: Props) {
  const completedCount = matches.filter(m => {
    const s = scores[m.id]
    return s?.home != null && s?.away != null
  }).length
  const total = matches.length
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div className="space-y-3">

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving || dirtyMatchIds.length === 0}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {saving
          ? 'Guardando...'
          : dirtyMatchIds.length > 0
            ? `Guardar pronósticos (${dirtyMatchIds.length})`
            : 'Sin cambios pendientes'}
      </button>

      {/* Progress */}
      <div className="surface-card border border-gray-800 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Progreso</span>
          <span className="font-semibold text-white">{completedCount} / {total}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {completedCount === total
            ? '¡Todos los pronósticos ingresados!'
            : `${total - completedCount} partido${total - completedCount !== 1 ? 's' : ''} sin completar`}
        </p>
      </div>

      {/* Pending changes */}
      {dirtyMatchIds.length > 0 && (
        <div className="surface-card border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Sin guardar</p>
          <div className="space-y-2">
            {dirtyMatchIds.map(matchId => {
              const match = matches.find(m => m.id === matchId)
              const s = scores[matchId]
              if (!match || !s) return null
              const hf = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const af = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
              return (
                <div key={matchId} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 truncate">
                    {hf} {match.homeTeamCode} — {match.awayTeamCode} {af}
                  </span>
                  <span className="text-sm font-bold text-white shrink-0 tabular-nums">
                    {s.home ?? '·'} – {s.away ?? '·'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Saved matches — desktop collapses these from the list; show here with edit option */}
      {savedMatchIds.length > 0 && (
        <div className="surface-card border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Guardados</p>
          <div className="space-y-2">
            {savedMatchIds.map(matchId => {
              const match = matches.find(m => m.id === matchId)
              const s = scores[matchId]
              if (!match || !s) return null
              const hf = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const af = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
              return (
                <div key={matchId} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500 truncate">
                    {hf} {match.homeTeamCode} — {match.awayTeamCode} {af}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-[var(--accent-light)] tabular-nums">
                      {s.home ?? '·'} – {s.away ?? '·'}
                    </span>
                    <button
                      onClick={() => onEditSaved(matchId)}
                      className="text-gray-500 hover:text-white transition-colors p-0.5"
                      title="Editar pronóstico"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Deadline */}
      <div className="surface-card border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-2.5">
        <span className="text-base leading-none shrink-0">⏰</span>
        <div>
          <p className="text-xs text-gray-500">Cierre de pronósticos</p>
          <p className="text-xs font-medium text-gray-300 mt-0.5">
            {formatDeadline(matchday.predictionDeadline)}
          </p>
        </div>
      </div>

    </div>
  )
}

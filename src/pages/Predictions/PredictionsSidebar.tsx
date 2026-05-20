import type { Match, Matchday, Team } from '@/types'

type LocalScore = { home: number | null; away: number | null; tieWinner: string | null }

interface Props {
  matches: Match[]
  scores: Record<string, LocalScore>
  dirtyMatchIds: string[]
  matchday: Matchday
  teamsMap: Record<string, Team>
  saving: boolean
  onSave: () => void
}

function formatDeadline(ts: any) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

export default function PredictionsSidebar({
  matches, scores, dirtyMatchIds, matchday, teamsMap, saving, onSave,
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

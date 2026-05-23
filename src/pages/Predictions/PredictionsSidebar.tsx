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

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  const hasChanges = dirtyMatchIds.length > 0

  return (
    <div className="space-y-3">

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving || !hasChanges}
        style={hasChanges && !saving ? {
          background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 55%, var(--accent-hover, var(--accent)) 100%)',
          boxShadow: '0 4px 18px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.15)',
          color: '#fff',
        } : {
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.2)',
        }}
        className="w-full font-semibold py-3 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2.5 disabled:cursor-default"
      >
        {saving ? (
          <span style={{ opacity: 0.7 }}>Guardando…</span>
        ) : hasChanges ? (
          <>
            <span>Guardar pronósticos</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}
            >
              {dirtyMatchIds.length}
            </span>
          </>
        ) : (
          <span>Sin cambios pendientes</span>
        )}
      </button>

      {/* Progress */}
      <div className="surface-card border border-gray-800 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Progreso</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tabular-nums">{completedCount}/{total}</span>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: progressPct === 100 ? 'var(--accent-light)' : 'var(--accent)' }}
            >
              {progressPct}%
            </span>
          </div>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-light) 100%)',
              boxShadow: progressPct > 0 ? '0 0 8px var(--accent-muted)' : 'none',
            }}
          />
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {completedCount === total
            ? '¡Todos los pronósticos ingresados!'
            : `${total - completedCount} partido${total - completedCount !== 1 ? 's' : ''} sin completar`}
        </p>
      </div>

      {/* Pending changes */}
      {dirtyMatchIds.length > 0 && (
        <div className="surface-card border border-gray-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Sin guardar
          </p>
          <div className="space-y-2.5">
            {dirtyMatchIds.map(matchId => {
              const match = matches.find(m => m.id === matchId)
              const s = scores[matchId]
              if (!match || !s) return null
              const hf = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const af = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
              return (
                <div key={matchId} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {hf} {match.homeTeamCode} — {match.awayTeamCode} {af}
                  </span>
                  <span
                    className="text-sm font-bold shrink-0 tabular-nums"
                    style={{ color: 'var(--accent)', fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '1rem', letterSpacing: '0.04em' }}
                  >
                    {s.home ?? '·'} – {s.away ?? '·'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Saved matches */}
      {savedMatchIds.length > 0 && (
        <div className="surface-card border border-gray-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Guardados
          </p>
          <div className="space-y-2.5">
            {savedMatchIds.map(matchId => {
              const match = matches.find(m => m.id === matchId)
              const s = scores[matchId]
              if (!match || !s) return null
              const hf = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
              const af = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
              return (
                <div key={matchId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Green dot */}
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: 'var(--accent)', boxShadow: '0 0 4px var(--accent-muted)', opacity: 0.8 }}
                    />
                    <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {hf} {match.homeTeamCode} — {match.awayTeamCode} {af}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: '0.95rem', letterSpacing: '0.04em' }}
                    >
                      {s.home ?? '·'}–{s.away ?? '·'}
                    </span>
                    <button
                      onClick={() => onEditSaved(matchId)}
                      className="transition-colors p-0.5"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      title="Editar pronóstico"
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
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
      <div
        className="surface-card border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-2.5"
      >
        <span
          className="shrink-0"
          style={{ color: 'rgba(255,200,50,0.65)' }}
        >
          <ClockIcon />
        </span>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Cierre de pronósticos
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,200,50,0.75)' }}>
            {formatDeadline(matchday.predictionDeadline)}
          </p>
        </div>
      </div>

    </div>
  )
}

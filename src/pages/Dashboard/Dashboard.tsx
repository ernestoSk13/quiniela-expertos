import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useMatchdays } from '@/hooks/useMatchdays'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useTeamsMap } from '@/hooks/useTeams'
import { useMatchdayProgress } from '@/hooks/useMatchdayProgress'
import { updateBonusPredictions } from '@/services/firestoreUsers'
import Avatar from '@/components/Avatar'
import StatusBadge from '@/components/StatusBadge'
import ThemeSelector from '@/components/ThemeSelector'
import LeaderboardTable from './LeaderboardTable'
import BonusSummary from './BonusSummary'
import TournamentCountdown from './TournamentCountdown'
import PlayerHistoryModal from './PlayerHistoryModal'
import LeaderboardShareCard from './LeaderboardShareCard'
import { useTheme } from '@/context/ThemeContext'
import type { BonusPredictions } from '@/types/User'
import type { User } from '@/types'

function formatDeadline(ts: ReturnType<typeof Date.now> | any) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) ?? '—'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { themeId } = useTheme()
  const { matchdays, loading: matchdaysLoading } = useMatchdays()
  const { players, loading: leaderboardLoading } = useLeaderboard()
  const { teamsMap } = useTeamsMap()
  const navigate = useNavigate()
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null)

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  const nextMatchday = matchdays.find(md => md.status === 'open' || md.status === 'upcoming')
  const teams = Object.values(teamsMap)
  const { filled, total } = useMatchdayProgress(
    nextMatchday?.status === 'open' ? (nextMatchday.id ?? '') : '',
    user?.uid ?? '',
  )

  async function handleSaveBonus(bonus: BonusPredictions) {
    if (!user) return
    await updateBonusPredictions(user.uid, bonus)
  }

  return (
    <div className="min-h-screen app-bg text-white">
      {/* Nav */}
      <header className="border-b border-gray-800 surface-nav sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="font-bold text-white text-sm">Quiniela Expertos</span>

          <div className="flex items-center gap-3">
            <ThemeSelector />
            <div className="flex items-center gap-2">
              <Avatar
                url={user?.avatarUrl ?? ''}
                name={user?.displayName || '?'}
                size="sm"
              />
              <span className="text-sm text-gray-300 hidden sm:block">{user?.displayName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <TournamentCountdown />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Leaderboard — takes 2/3 on desktop */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold mb-4">Tabla general</h2>
            {leaderboardLoading ? (
              <p className="text-gray-500 text-sm">Cargando tabla...</p>
            ) : (
              <>
                <LeaderboardTable
                  players={players}
                  currentUserId={user?.uid ?? ''}
                  onPlayerClick={setSelectedPlayer}
                />
                {user && (() => {
                  const pos = players.findIndex(p => p.uid === user.uid) + 1
                  return pos > 0 ? (
                    <LeaderboardShareCard position={pos} player={user} themeId={themeId} />
                  ) : null
                })()}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Next matchday */}
            <div className="surface-card border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Siguiente jornada
              </h3>

              {matchdaysLoading ? (
                <p className="text-gray-500 text-sm">Cargando...</p>
              ) : !nextMatchday ? (
                <p className="text-gray-500 text-sm">No hay jornadas próximas.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{nextMatchday.name}</span>
                    <StatusBadge status={nextMatchday.status} type="matchday" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Deadline:{' '}
                    <span className="text-gray-400">
                      {formatDeadline(nextMatchday.predictionDeadline)}
                    </span>
                  </p>
                  {nextMatchday.status === 'open' && total > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Mis pronósticos</span>
                        <span className={`font-semibold tabular-nums ${filled === total ? 'text-[var(--accent-light)]' : 'text-gray-400'}`}>
                          {filled} / {total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((filled / total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/jornada/${nextMatchday.id}`)}
                    disabled={nextMatchday.status !== 'open'}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {nextMatchday.status === 'open'
                      ? filled === 0 ? 'Hacer pronósticos' : filled < total ? 'Continuar pronósticos' : 'Ver pronósticos'
                      : 'Aún no disponible'}
                  </button>
                </div>
              )}
            </div>

            {/* Bonus predictions */}
            {user?.bonusPredictions && (
              <BonusSummary
                bonus={user.bonusPredictions}
                teams={teams}
                teamsMap={teamsMap}
                onSave={handleSaveBonus}
              />
            )}

          </div>
        </div>

        {/* Past matchdays */}
        {(() => {
          const past = matchdays
            .filter(md => md.status === 'closed' || md.status === 'finished')
            .slice()
            .reverse()
          if (past.length === 0) return null
          return (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4">Jornadas anteriores</h2>
              <div className="surface-card border border-gray-800 rounded-xl divide-y divide-gray-800/60 overflow-hidden">
                {past.map(md => (
                  <button
                    key={md.id}
                    onClick={() => navigate(`/jornada/${md.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-card)] transition-colors text-left"
                  >
                    <span className="text-sm text-gray-300">{md.name}</span>
                    <span className="text-xs text-[var(--accent)] shrink-0">Ver resultados →</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}
      </main>

      {selectedPlayer && (
        <PlayerHistoryModal
          player={selectedPlayer}
          isOwnProfile={selectedPlayer.uid === user?.uid}
          teamsMap={teamsMap}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

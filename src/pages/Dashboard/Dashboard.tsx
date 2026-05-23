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
import PlayerHistoryModal, { HistoryContent } from './PlayerHistoryModal'
import LeaderboardShareCard from './LeaderboardShareCard'
import { useTheme } from '@/context/ThemeContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import type { BonusPredictions } from '@/types/User'
import type { User } from '@/types'

type TabId = 'predictions' | 'leaderboard' | 'history'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'predictions',
    label: 'Pronósticos',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
      </svg>
    ),
  },
  {
    id: 'leaderboard',
    label: 'Tabla',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
        <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Historial',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
      </svg>
    ),
  },
]

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
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: User; position: number } | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('predictions')
  const push = usePushNotifications()

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

  const pastMatchdays = matchdays
    .filter(md => md.status === 'closed' || md.status === 'finished')
    .slice()
    .reverse()

  const userPosition = players.findIndex(p => p.uid === user?.uid) + 1

  // ── Shared section blocks ──────────────────────────────────────────────────

  const nextMatchdayCard = (
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
  )

  const pastMatchdaysSection = pastMatchdays.length > 0 ? (
    <div>
      <h2 className="text-lg font-bold mb-4">Jornadas anteriores</h2>
      <div className="surface-card border border-gray-800 rounded-xl divide-y divide-gray-800/60 overflow-hidden">
        {pastMatchdays.map(md => (
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
  ) : null

  const leaderboardSection = (
    <>
      <h2 className="text-lg font-bold mb-4">Tabla general</h2>
      {leaderboardLoading ? (
        <p className="text-gray-500 text-sm">Cargando tabla...</p>
      ) : (
        <>
          <LeaderboardTable
            players={players}
            currentUserId={user?.uid ?? ''}
            onPlayerClick={(player, position) => setSelectedPlayer({ player, position })}
          />
          {user && userPosition > 0 && (
            <LeaderboardShareCard position={userPosition} player={user} themeId={themeId} />
          )}
        </>
      )}
    </>
  )

  const historySection = user ? (
    <>
      <h2 className="text-lg font-bold mb-4">Mi historial</h2>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {[
          { label: 'Puntos',    value: user.stats.totalPoints,       accent: true  },
          { label: 'Exactos',   value: user.stats.exactPredictions,  accent: false },
          { label: 'Correctos', value: user.stats.correctPredictions, accent: false },
          { label: 'Enviados',  value: user.stats.totalPredictions,  accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-gray-900/60 rounded-xl px-2 py-3 text-center">
            <p className={`text-xl font-black tabular-nums ${accent ? 'text-[var(--accent-light)]' : 'text-white'}`}>
              {value}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <HistoryContent userId={user.uid} teamsMap={teamsMap} />
    </>
  ) : null

  return (
    <div className="min-h-screen app-bg text-white">

      {/* Nav */}
      <header className="border-b border-gray-800 surface-nav sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="font-bold text-white text-sm">Quiniela Expertos</span>
          <div className="flex items-center gap-3">
            {push.isSupported && (
              <button
                onClick={push.toggle}
                disabled={push.isLoading || push.permission === 'denied'}
                title={
                  push.permission === 'denied'
                    ? 'Notificaciones bloqueadas en el navegador'
                    : push.isEnabled
                    ? 'Desactivar notificaciones'
                    : 'Activar notificaciones'
                }
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {push.isLoading ? (
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className="animate-spin opacity-60">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                ) : push.isEnabled ? (
                  /* campana activa (rellena) */
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className="text-[var(--accent-light)]">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                ) : (
                  /* campana inactiva (outline) */
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                  </svg>
                )}
              </button>
            )}
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

      {/* ── Mobile: tab panels (hidden on lg+) ─────────────────────────────── */}
      <main className="lg:hidden max-w-5xl mx-auto px-4 py-6 pb-28">
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            <TournamentCountdown />
            {nextMatchdayCard}
            {user?.bonusPredictions && (
              <BonusSummary
                bonus={user.bonusPredictions}
                teams={teams}
                teamsMap={teamsMap}
                onSave={handleSaveBonus}
              />
            )}
            {pastMatchdays.length > 0 && (
              <div className="pt-2">{pastMatchdaysSection}</div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>{leaderboardSection}</div>
        )}

        {activeTab === 'history' && (
          <div>{historySection}</div>
        )}
      </main>

      {/* ── Desktop: original grid layout (hidden below lg) ────────────────── */}
      <main className="hidden lg:block max-w-5xl mx-auto px-4 py-8">
        <TournamentCountdown />
        <div className="grid grid-cols-3 gap-6">

          {/* Leaderboard — 2/3 */}
          <div className="col-span-2">
            {leaderboardSection}
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">
            {nextMatchdayCard}
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

        {pastMatchdays.length > 0 && (
          <div className="mt-8">{pastMatchdaysSection}</div>
        )}
      </main>

      {/* ── Mobile bottom tab bar ───────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 surface-nav border-t border-gray-800 flex z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === id ? 'text-[var(--accent-light)]' : 'text-gray-500'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {selectedPlayer && (
        <PlayerHistoryModal
          player={selectedPlayer.player}
          position={selectedPlayer.position}
          isOwnProfile={selectedPlayer.player.uid === user?.uid}
          teamsMap={teamsMap}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

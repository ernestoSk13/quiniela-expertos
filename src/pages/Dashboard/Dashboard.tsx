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
import { PreferencesContent } from '@/pages/Preferences/Preferences'
import { useTheme } from '@/context/ThemeContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import type { BonusPredictions } from '@/types/User'
import type { User } from '@/types'

type TabId = 'predictions' | 'leaderboard' | 'history' | 'preferences'

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
  {
    id: 'preferences',
    label: 'Preferencias',
    icon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  },
]

function formatDeadline(ts: any, timezone: string) {
  return ts?.toDate().toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }) ?? '—'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { themeId } = useTheme()
  const timezone = useUserTimezone()
  const { matchdays, loading: matchdaysLoading } = useMatchdays()
  const { players, loading: leaderboardLoading } = useLeaderboard()
  const { teamsMap } = useTeamsMap()
  const navigate = useNavigate()
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: User; position: number } | null>(null)
  const isObserver = user?.role === 'observer'
  const [activeTab, setActiveTab] = useState<TabId>(isObserver ? 'leaderboard' : 'predictions')
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
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--surface-card) 0%, rgba(5,21,16,0.7) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: '3px solid var(--accent)',
        boxShadow: '0 0 0 0 transparent, inset 3px 0 12px -4px var(--accent-muted)',
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {nextMatchday?.status === 'open' && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: 'var(--accent)' }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: 'var(--accent)' }}
              />
            </span>
          )}
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
            Siguiente jornada
          </h3>
        </div>

        {matchdaysLoading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : !nextMatchday ? (
          <p className="text-gray-500 text-sm">No hay jornadas próximas.</p>
        ) : (
          <div className="space-y-3">
            {/* Jornada name + badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white leading-tight">{nextMatchday.name}</span>
              <StatusBadge status={nextMatchday.status} type="matchday" />
            </div>

            {/* Deadline with clock icon */}
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor" className="shrink-0 text-gray-600">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-4.5a.5.5 0 0 1 .5.5v4.25l2.75 1.65a.5.5 0 0 1-.5.87L7.25 9a.5.5 0 0 1-.25-.43V4a.5.5 0 0 1 .5-.5z"/>
              </svg>
              <span>Deadline: <span className="text-gray-400 font-medium">{formatDeadline(nextMatchday.predictionDeadline, timezone)}</span></span>
            </p>

            {/* Progress bar */}
            {nextMatchday.status === 'open' && total > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Mis pronósticos</span>
                  <span className={`font-semibold tabular-nums ${filled === total ? 'text-[var(--accent-light)]' : 'text-gray-400'}`}>
                    {filled} / {total}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((filled / total) * 100)}%`,
                      background: filled === total
                        ? 'var(--accent-light)'
                        : 'var(--accent)',
                      boxShadow: filled === total
                        ? '0 0 8px var(--accent-light)'
                        : '0 0 4px var(--accent-muted)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* CTA button */}
            <button
              onClick={() => navigate(`/jornada/${nextMatchday.id}`)}
              disabled={nextMatchday.status !== 'open'}
              className="w-full font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 disabled:bg-gray-800/60 disabled:text-gray-600 disabled:cursor-default"
              style={
                nextMatchday.status === 'open'
                  ? {
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                      color: '#fff',
                      boxShadow: '0 2px 12px var(--accent-muted)',
                    }
                  : {}
              }
              onMouseEnter={e => {
                if (nextMatchday.status === 'open') {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px var(--accent-muted)'
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                if (nextMatchday.status === 'open') {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px var(--accent-muted)'
                  ;(e.currentTarget as HTMLButtonElement).style.transform = ''
                }
              }}
            >
              {nextMatchday.status === 'open'
                ? filled === 0 ? 'Hacer pronósticos' : filled < total ? 'Continuar pronósticos' : 'Ver pronósticos'
                : 'Aún no disponible'}
            </button>
          </div>
        )}
      </div>
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
          { label: 'Puntos',    value: user.stats.totalPoints,         accent: true  },
          { label: 'Aciertos',  value: user.stats.correctPredictions,  accent: false },
          { label: 'Enviados',  value: user.stats.totalPredictions,    accent: false },
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
            {/* Bell + ThemeSelector + Preferencias: desktop only (on mobile they live in Preferencias tab) */}
            <div className="hidden lg:flex items-center gap-3">
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
              <button
                onClick={() => navigate('/preferencias')}
                title="Preferencias"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Avatar
                url={user?.avatarUrl ?? ''}
                name={user?.displayName || '?'}
                size="sm"
              />
              <span className="text-sm text-gray-300 hidden sm:block">{user?.displayName}</span>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{
                  background: 'var(--accent-deep)',
                  border: '1px solid var(--accent-muted)',
                  color: 'var(--accent-light)',
                }}
              >
                Admin
              </button>
            )}
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
            {isObserver && (
              <div className="rounded-xl px-4 py-3 text-center text-sm text-gray-500 border border-gray-800" style={{ background: 'var(--surface-card)' }}>
                👁️ Modo Observador — no participas en pronósticos ni en la tabla
              </div>
            )}
            {!isObserver && nextMatchdayCard}
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

        {activeTab === 'preferences' && (
          <PreferencesContent />
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
            {!isObserver && nextMatchdayCard}
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

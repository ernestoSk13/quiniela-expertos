import { useState } from 'react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useTeamsMap } from '@/hooks/useTeams'
import LeaderboardTable from '@/pages/Dashboard/LeaderboardTable'
import PlayerHistoryModal from '@/pages/Dashboard/PlayerHistoryModal'
import LeaderboardPNGCard from './LeaderboardPNGCard'
import type { User } from '@/types'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

export default function AdminLeaderboard() {
  const { players, loading } = useLeaderboard()
  const { teamsMap } = useTeamsMap()
  const [selected, setSelected] = useState<{ player: User; position: number } | null>(null)

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
            TABLA GENERAL
          </h1>
          {!loading && (
            <span style={{
              background: 'var(--accent-deep)', border: '1px solid var(--accent-muted)',
              borderRadius: 99, padding: '2px 8px', fontSize: '0.65rem',
              letterSpacing: '0.12em', color: 'var(--accent-light)',
            }}>
              {players.length} jugadores
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          Clasificación global. Haz clic en un jugador para ver su historial.
        </p>
      </div>

      {loading ? (
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', padding: '32px 0', textAlign: 'center' }}>
          Cargando tabla...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Export card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <LeaderboardPNGCard players={players} />
          </div>

          {/* Table */}
          <LeaderboardTable
            players={players}
            currentUserId=""
            onPlayerClick={(player, position) => setSelected({ player, position })}
          />
        </div>
      )}

      {selected && (
        <PlayerHistoryModal
          player={selected.player}
          position={selected.position}
          isOwnProfile={true}
          teamsMap={teamsMap}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

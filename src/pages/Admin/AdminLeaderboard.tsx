import { useState } from 'react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useTeamsMap } from '@/hooks/useTeams'
import LeaderboardTable from '@/pages/Dashboard/LeaderboardTable'
import PlayerHistoryModal from '@/pages/Dashboard/PlayerHistoryModal'
import LeaderboardPNGCard from './LeaderboardPNGCard'
import type { User } from '@/types'

export default function AdminLeaderboard() {
  const { players, loading } = useLeaderboard()
  const { teamsMap } = useTeamsMap()
  const [selected, setSelected] = useState<{ player: User; position: number } | null>(null)

  if (loading) {
    return <p className="text-gray-500 text-sm py-8 text-center">Cargando tabla...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Tabla general</h1>
        <LeaderboardPNGCard players={players} />
      </div>

      <LeaderboardTable
        players={players}
        currentUserId=""
        onPlayerClick={(player, position) => setSelected({ player, position })}
      />

      {selected && (
        <PlayerHistoryModal
          player={selected.player}
          position={selected.position}
          isOwnProfile={true}
          teamsMap={teamsMap}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

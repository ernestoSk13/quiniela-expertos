import { useState } from 'react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useTeamsMap } from '@/hooks/useTeams'
import LeaderboardTable from '@/pages/Dashboard/LeaderboardTable'
import PlayerHistoryModal from '@/pages/Dashboard/PlayerHistoryModal'
import type { User } from '@/types'

export default function AdminLeaderboard() {
  const { players, loading } = useLeaderboard()
  const { teamsMap } = useTeamsMap()
  const [selected, setSelected] = useState<User | null>(null)

  if (loading) {
    return <p className="text-gray-500 text-sm py-8 text-center">Cargando tabla...</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tabla general</h1>

      <LeaderboardTable
        players={players}
        currentUserId=""
        onPlayerClick={setSelected}
      />

      {selected && (
        <PlayerHistoryModal
          player={selected}
          isOwnProfile={true}
          teamsMap={teamsMap}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

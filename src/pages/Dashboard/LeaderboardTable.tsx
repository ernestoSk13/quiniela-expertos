import LeaderboardRow, { ROW_GAP } from '@/components/LeaderboardRow'
import { useTheme } from '@/context/ThemeContext'
import type { User } from '@/types'

interface Props {
  players: User[]
  currentUserId: string
  onPlayerClick: (player: User, position: number) => void
}

export default function LeaderboardTable({ players, currentUserId, onPlayerClick }: Props) {
  const { themeId } = useTheme()

  if (players.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        Aún no hay jugadores en la tabla.
      </p>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
        {players.map((player, i) => (
          <LeaderboardRow
            key={player.uid}
            player={player}
            position={i + 1}
            themeId={themeId}
            isCurrentUser={player.uid === currentUserId}
            onClick={() => onPlayerClick(player, i + 1)}
          />
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-600 pt-3">
        Toca cualquier fila para ver estadísticas
      </p>
    </div>
  )
}

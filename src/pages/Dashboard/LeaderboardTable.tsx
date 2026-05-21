import Avatar from '@/components/Avatar'
import type { User } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  players: User[]
  currentUserId: string
  onPlayerClick: (player: User) => void
}

export default function LeaderboardTable({ players, currentUserId, onPlayerClick }: Props) {
  if (players.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        Aún no hay jugadores en la tabla.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="surface-card text-gray-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left w-10">#</th>
            <th className="px-4 py-3 text-left">Jugador</th>
            <th className="px-4 py-3 text-right">Pts</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">Exactos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {players.map((player, i) => {
            const isCurrent = player.uid === currentUserId
            return (
              <tr
                key={player.uid}
                onClick={() => onPlayerClick(player)}
                className={`transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--accent-deep)] hover:bg-[var(--accent-muted)]'
                    : 'bg-[var(--surface-card)]/60 hover:bg-[var(--surface-card)]'
                }`}
              >
                <td className="px-4 py-3 text-center">
                  {i < 3 ? (
                    <span className="text-base leading-none">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-gray-500">{i + 1}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar url={player.avatarUrl} name={player.displayName} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`truncate ${isCurrent ? 'text-[var(--accent-light)] font-medium' : 'text-gray-200'}`}>
                          {player.displayName}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-[var(--accent)] shrink-0">tú</span>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="text-[11px] text-[var(--accent)] opacity-80">
                          Ver mi historial →
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-white tabular-nums">
                  {player.stats.totalPoints}
                </td>
                <td className="px-4 py-3 text-right text-gray-400 tabular-nums hidden sm:table-cell">
                  {player.stats.exactPredictions}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-center text-[11px] text-gray-600 py-2.5 border-t border-gray-800/60">
        Toca cualquier fila para ver estadísticas
      </p>
    </div>
  )
}

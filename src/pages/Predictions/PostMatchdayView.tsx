import { useMemo } from 'react'
import Avatar from '@/components/Avatar'
import { useAllMatchdayPredictions } from '@/hooks/useAllMatchdayPredictions'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { Match, Prediction, Team } from '@/types'

interface Props {
  matchdayId: string
  matches: Match[]
  teamsMap: Record<string, Team>
}

function PointsBadge({ points, isExact }: { points: number | null; isExact: boolean | null }) {
  if (points === null) {
    return <span className="text-xs text-gray-600 w-7 text-right shrink-0">—</span>
  }
  if (isExact) {
    return <span className="text-xs font-bold text-green-400 w-7 text-right shrink-0">+3</span>
  }
  if (points === 1) {
    return <span className="text-xs font-bold text-yellow-400 w-7 text-right shrink-0">+1</span>
  }
  return <span className="text-xs font-bold text-gray-500 w-7 text-right shrink-0">+0</span>
}

export default function PostMatchdayView({ matchdayId, matches, teamsMap }: Props) {
  const { predictions, loading: predsLoading } = useAllMatchdayPredictions(matchdayId, true)
  const { players, loading: playersLoading } = useLeaderboard()

  const predMap = useMemo(() => {
    const map = new Map<string, Map<string, Prediction>>()
    for (const pred of predictions) {
      if (!map.has(pred.matchId)) map.set(pred.matchId, new Map())
      map.get(pred.matchId)!.set(pred.userId, pred)
    }
    return map
  }, [predictions])

  if (predsLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 text-sm">Cargando pronósticos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-6">
      {matches.map(match => {
        const matchPreds = predMap.get(match.id)
        const homeFlag = teamsMap[match.homeTeamCode]?.flag ?? '🏳️'
        const awayFlag = teamsMap[match.awayTeamCode]?.flag ?? '🏳️'
        const hasResult = match.homeScore !== null && match.awayScore !== null

        const sortedPlayers = [...players].sort((a, b) => {
          const pa = matchPreds?.get(a.uid)
          const pb = matchPreds?.get(b.uid)
          if (!pa && !pb) return 0
          if (!pa) return 1
          if (!pb) return -1
          const ptsA = pa.points ?? -1
          const ptsB = pb.points ?? -1
          return ptsB - ptsA
        })

        return (
          <div key={match.id} className="surface-card border border-gray-800 rounded-xl overflow-hidden">
            {/* Match header with real result */}
            <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-3">
              <span className="text-sm text-gray-300 truncate text-right flex-1">
                {homeFlag} {match.homeTeamCode}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {hasResult ? (
                  <>
                    <span className="text-xl font-bold text-white tabular-nums">{match.homeScore}</span>
                    <span className="text-gray-600">—</span>
                    <span className="text-xl font-bold text-white tabular-nums">{match.awayScore}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-600 px-1">pendiente</span>
                )}
              </div>
              <span className="text-sm text-gray-300 truncate flex-1">
                {match.awayTeamCode} {awayFlag}
              </span>
            </div>

            {/* Per-player predictions */}
            <div className="divide-y divide-gray-800/40">
              {sortedPlayers.map(player => {
                const pred = matchPreds?.get(player.uid)
                return (
                  <div key={player.uid} className="flex items-center gap-2.5 px-3 py-2">
                    <Avatar url={player.avatarUrl} name={player.displayName} size="sm" />
                    <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">
                      {player.displayName}
                    </span>
                    {pred ? (
                      <>
                        <span className="text-sm font-bold tabular-nums text-gray-200 shrink-0">
                          {pred.homeScore} – {pred.awayScore}
                        </span>
                        <PointsBadge points={pred.points} isExact={pred.isExact} />
                      </>
                    ) : (
                      <span className="text-xs text-gray-600 shrink-0">sin pronóstico</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

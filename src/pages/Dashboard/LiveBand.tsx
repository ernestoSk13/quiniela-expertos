import { useEffect, useMemo, useState } from 'react'
import Avatar from '@/components/Avatar'
import { getMatchPredictions } from '@/services/firestorePredictions'
import type { Match } from '@/types/Match'
import type { Prediction, PredictionResult } from '@/types/Prediction'
import type { User } from '@/types/User'
import type { Team } from '@/types/Team'

interface Props {
  matches: Match[]
  players: User[]
  teamsMap: Record<string, Team>
}

const RESULT_LABEL: Record<PredictionResult, string> = {
  home: 'LOCAL',
  draw: 'EMP',
  away: 'VISIT',
}

const RESULT_STYLE: Record<PredictionResult, string> = {
  home: 'bg-green-500/20 text-green-400',
  draw: 'bg-yellow-500/20 text-yellow-400',
  away: 'bg-blue-500/20 text-blue-400',
}

export default function LiveBand({ matches, players, teamsMap }: Props) {
  const [now, setNow] = useState(Date.now())
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [predsMap, setPredsMap] = useState<Record<string, Prediction>>({})
  const [predsLoading, setPredsLoading] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const liveMatches = useMemo(
    () => matches.filter(m => m.scheduledAt.toDate().getTime() <= now && m.status !== 'finished'),
    [matches, now],
  )

  const safeIdx = liveMatches.length > 0 ? Math.min(selectedIdx, liveMatches.length - 1) : 0
  const selectedMatch = liveMatches[safeIdx] ?? null
  const selectedMatchId = selectedMatch?.id ?? null

  useEffect(() => {
    if (!selectedMatchId) {
      setPredsMap({})
      return
    }
    let cancelled = false
    setPredsLoading(true)
    setPredsMap({})
    getMatchPredictions(selectedMatchId)
      .then(preds => {
        if (cancelled) return
        const map: Record<string, Prediction> = {}
        for (const p of preds) map[p.userId] = p
        setPredsMap(map)
        setPredsLoading(false)
      })
      .catch(() => {
        if (!cancelled) setPredsLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedMatchId])

  if (liveMatches.length === 0) return null

  const home = selectedMatch ? teamsMap[selectedMatch.homeTeamCode] : null
  const away = selectedMatch ? teamsMap[selectedMatch.awayTeamCode] : null

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(5,21,16,0.7) 100%)',
        border: '1px solid rgba(239,68,68,0.18)',
        borderLeft: '3px solid #ef4444',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-red-400">En juego</span>
        </div>

        {/* Match selector when multiple live matches */}
        {liveMatches.length > 1 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {liveMatches.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedIdx(i)}
                className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  i === safeIdx
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                <span>{teamsMap[m.homeTeamCode]?.flag ?? '🏳️'}</span>
                <span className="text-gray-600 mx-0.5">–</span>
                <span>{teamsMap[m.awayTeamCode]?.flag ?? '🏳️'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Match info */}
      {selectedMatch && (
        <div className="flex items-center justify-center gap-2 px-4 pb-3">
          <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
            <span className="text-xs font-semibold text-white/80 text-right truncate">
              {home?.name ?? selectedMatch.homeTeamCode}
            </span>
            <span className="text-lg leading-none shrink-0">{home?.flag ?? '🏳️'}</span>
          </div>
          <div className="shrink-0 px-1">
            {selectedMatch.homeScore != null && selectedMatch.awayScore != null ? (
              <span className="text-base font-black tabular-nums text-white">
                {selectedMatch.homeScore} – {selectedMatch.awayScore}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-600">VS</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-lg leading-none shrink-0">{away?.flag ?? '🏳️'}</span>
            <span className="text-xs font-semibold text-white/80 truncate">
              {away?.name ?? selectedMatch.awayTeamCode}
            </span>
          </div>
        </div>
      )}

      <div className="h-px mx-4" style={{ background: 'rgba(239,68,68,0.12)' }} />

      {/* Predictions grid */}
      <div className="pt-3 pb-4">
        {predsLoading ? (
          <p className="text-center text-gray-600 text-xs py-1 px-4">Cargando pronósticos...</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
            {players.map(player => {
              const pred = predsMap[player.uid]
              return (
                <div key={player.uid} className="flex flex-col items-center gap-1.5 shrink-0">
                  <Avatar url={player.avatarUrl} name={player.displayName} size="md" />
                  <span className="text-[10px] text-gray-400 text-center truncate leading-tight" style={{ width: 40 }}>
                    {player.displayName.split(' ')[0]}
                  </span>
                  {pred?.result ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${RESULT_STYLE[pred.result]}`}>
                      {RESULT_LABEL[pred.result]}
                    </span>
                  ) : (
                    <span className="text-base leading-none">😔</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

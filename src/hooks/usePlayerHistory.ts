import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Matchday, Prediction, Match } from '@/types'
import { getUserPredictions } from '@/services/firestorePredictions'
import { getFinishedMatches } from '@/services/firestoreMatches'

export interface PredictionWithMatch {
  prediction: Prediction
  match: Match
}

export interface MatchdayHistory {
  matchday: Matchday
  predictions: PredictionWithMatch[]
  pointsEarned: number
  cumulativePoints: number
}

export function usePlayerHistory(userId: string) {
  const [history, setHistory] = useState<MatchdayHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)

    async function load() {
      const [predictions, finishedMatches, matchdaysSnap] = await Promise.all([
        getUserPredictions(userId),
        getFinishedMatches(),
        getDocs(collection(db, 'matchdays')),
      ])
      if (cancelled) return

      const matchdays = matchdaysSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Matchday)
      const matchById = Object.fromEntries(finishedMatches.map(m => [m.id, m]))
      const predsByMatchday: Record<string, PredictionWithMatch[]> = {}

      for (const pred of predictions) {
        const match = matchById[pred.matchId]
        if (!match || pred.points === null) continue
        if (!predsByMatchday[pred.matchdayId]) predsByMatchday[pred.matchdayId] = []
        predsByMatchday[pred.matchdayId].push({ prediction: pred, match })
      }

      const sorted = matchdays
        .filter(md => predsByMatchday[md.id]?.length > 0)
        .sort((a, b) => a.order - b.order)

      let cumulative = 0
      const result: MatchdayHistory[] = sorted.map(matchday => {
        const preds = (predsByMatchday[matchday.id] ?? [])
          .sort((a, b) => a.match.scheduledAt.toMillis() - b.match.scheduledAt.toMillis())
        const pointsEarned = preds.reduce((sum, { prediction: p }) => sum + (p.points ?? 0), 0)
        cumulative += pointsEarned
        return { matchday, predictions: preds, pointsEarned, cumulativePoints: cumulative }
      })

      setHistory(result)
      setLoading(false)
    }

    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  return { history, loading }
}

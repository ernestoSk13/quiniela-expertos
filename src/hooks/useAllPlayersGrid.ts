import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Matchday, Match, Prediction } from '@/types'
import { getMatchdayAllPredictions } from '@/services/firestorePredictions'

export interface GridData {
  matchdays: Matchday[]
  matches: Match[]
  predByKey: Record<string, Prediction>  // key: `${userId}_${matchId}`
}

export function useAllPlayersGrid() {
  const [data, setData] = useState<GridData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Fetch all matchdays + finished matches in parallel.
      // We intentionally do NOT filter matchdays by status: a jornada can be
      // 'open' while some of its matches already have scores (e.g. the first
      // matches of the day are done but later ones haven't kicked off yet).
      const [mdSnap, matchesSnap] = await Promise.all([
        getDocs(query(collection(db, 'matchdays'), orderBy('order'))),
        getDocs(query(collection(db, 'matches'), where('status', '==', 'finished'))),
      ])
      if (cancelled) return

      const allMatchdays = mdSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Matchday)
      const matches = matchesSnap.docs
        .map(d => ({ ...d.data(), id: d.id }) as Match)
        .sort((a, b) => a.scheduledAt.toMillis() - b.scheduledAt.toMillis())

      if (matches.length === 0) {
        setData({ matchdays: [], matches: [], predByKey: {} })
        setLoading(false)
        return
      }

      // Only include matchdays that have at least one finished match.
      const matchdayIdsWithFinished = new Set(matches.map(m => m.matchdayId))
      const finishedMds = allMatchdays.filter(md => matchdayIdsWithFinished.has(md.id))

      const predGroups = await Promise.all(
        finishedMds.map(md => getMatchdayAllPredictions(md.id))
      )
      if (cancelled) return

      const predByKey: Record<string, Prediction> = {}
      for (const preds of predGroups) {
        for (const pred of preds) {
          predByKey[`${pred.userId}_${pred.matchId}`] = pred
        }
      }

      setData({ matchdays: finishedMds, matches, predByKey })
      setLoading(false)
    }

    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}

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
      const mdSnap = await getDocs(query(collection(db, 'matchdays'), orderBy('order')))
      const finishedMds = mdSnap.docs
        .map(d => ({ ...d.data(), id: d.id }) as Matchday)
        .filter(md => md.status === 'closed' || md.status === 'finished')

      if (finishedMds.length === 0) {
        if (!cancelled) { setData({ matchdays: [], matches: [], predByKey: {} }); setLoading(false) }
        return
      }

      const [matchesSnap, predGroups] = await Promise.all([
        getDocs(query(collection(db, 'matches'), where('status', '==', 'finished'))),
        Promise.all(finishedMds.map(md => getMatchdayAllPredictions(md.id))),
      ])
      if (cancelled) return

      const matches = matchesSnap.docs
        .map(d => ({ ...d.data(), id: d.id }) as Match)
        .sort((a, b) => a.scheduledAt.toMillis() - b.scheduledAt.toMillis())

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

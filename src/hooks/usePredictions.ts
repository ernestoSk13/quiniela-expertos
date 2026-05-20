import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Prediction } from '@/types'

/** Returns a map of matchId → Prediction for the given user and matchday. */
export function usePredictions(userId: string, matchdayId: string) {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId || !matchdayId) {
      setLoading(false)
      return
    }
    const q = query(
      collection(db, 'predictions'),
      where('userId', '==', userId),
      where('matchdayId', '==', matchdayId),
    )
    const snap = await getDocs(q)
    const map: Record<string, Prediction> = {}
    snap.docs.forEach(d => {
      const p = d.data() as Prediction
      map[p.matchId] = p
    })
    setPredictions(map)
    setLoading(false)
  }, [userId, matchdayId])

  useEffect(() => { load() }, [load])

  return { predictions, loading, refresh: load }
}

import { useEffect, useState } from 'react'
import { getMatchdayAllPredictions } from '@/services/firestorePredictions'
import type { Prediction } from '@/types'

export function useAllMatchdayPredictions(matchdayId: string, enabled: boolean) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !matchdayId) return
    let cancelled = false
    setLoading(true)
    getMatchdayAllPredictions(matchdayId).then(preds => {
      if (!cancelled) {
        setPredictions(preds)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [matchdayId, enabled])

  return { predictions, loading }
}

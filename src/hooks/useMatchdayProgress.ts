import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useMatchdayProgress(matchdayId: string, userId: string) {
  const [filled, setFilled] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchdayId || !userId) { setLoading(false); return }
    let cancelled = false

    async function load() {
      const [matchesSnap, predsSnap] = await Promise.all([
        getDocs(query(collection(db, 'matches'), where('matchdayId', '==', matchdayId))),
        getDocs(query(collection(db, 'predictions'), where('userId', '==', userId), where('matchdayId', '==', matchdayId))),
      ])
      if (cancelled) return
      const filledCount = predsSnap.docs.filter(d => {
        const { result } = d.data()
        return result != null
      }).length
      setTotal(matchesSnap.size)
      setFilled(filledCount)
      setLoading(false)
    }

    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [matchdayId, userId])

  return { filled, total, loading }
}

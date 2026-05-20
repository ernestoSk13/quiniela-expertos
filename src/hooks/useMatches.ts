import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Match } from '@/types'

export function useMatchesByMatchday(matchdayId: string) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchdayId) return
    const q = query(
      collection(db, 'matches'),
      where('matchdayId', '==', matchdayId),
      orderBy('scheduledAt'),
    )
    return onSnapshot(q, (snap) => {
      setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id }) as Match))
      setLoading(false)
    })
  }, [matchdayId])

  return { matches, loading }
}

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from '@/types'

export function useLeaderboard() {
  const [players, setPlayers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs
        .map(d => d.data() as User)
        .filter(u => u.onboardingCompleted)
        .sort((a, b) => {
          const byPoints = b.stats.totalPoints - a.stats.totalPoints
          if (byPoints !== 0) return byPoints
          return b.stats.exactPredictions - a.stats.exactPredictions
        })
      setPlayers(list)
      setLoading(false)
    })
  }, [])

  return { players, loading }
}

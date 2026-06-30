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
        .filter(u => u.onboardingCompleted && u.role !== 'observer')
        .sort((a, b) => {
          const byPoints = b.stats.totalPoints - a.stats.totalPoints
          if (byPoints !== 0) return byPoints
          const byExact = (b.stats.exactScoreCount ?? 0) - (a.stats.exactScoreCount ?? 0)
          if (byExact !== 0) return byExact
          return (a.stats.incorrectPredictions ?? 0) - (b.stats.incorrectPredictions ?? 0)
        })
      setPlayers(list)
      setLoading(false)
    })
  }, [])

  return { players, loading }
}

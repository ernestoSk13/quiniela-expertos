import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Matchday } from '@/types'

export function useMatchdays() {
  const [matchdays, setMatchdays] = useState<Matchday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'matchdays'), orderBy('order'))
    return onSnapshot(q, (snap) => {
      setMatchdays(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Matchday))
      setLoading(false)
    })
  }, [])

  return { matchdays, loading }
}

export function useMatchday(matchdayId: string) {
  const [matchday, setMatchday] = useState<Matchday | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchdayId) return
    return onSnapshot(doc(db, 'matchdays', matchdayId), (snap) => {
      setMatchday(snap.exists() ? ({ id: snap.id, ...snap.data() }) as Matchday : null)
      setLoading(false)
    })
  }, [matchdayId])

  return { matchday, loading }
}

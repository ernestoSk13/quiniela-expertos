import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Team } from '@/types'

/** Devuelve un mapa de código ISO → Team para lookups O(1). */
export function useTeamsMap() {
  const [teamsMap, setTeamsMap] = useState<Record<string, Team>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'teams'), (snap) => {
      const map: Record<string, Team> = {}
      snap.docs.forEach(d => { map[d.id] = d.data() as Team })
      setTeamsMap(map)
      setLoading(false)
    })
  }, [])

  return { teamsMap, loading }
}

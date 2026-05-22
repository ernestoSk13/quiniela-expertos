import { useState, useEffect } from 'react'
import { subscribeScoringConfig, DEFAULT_SCORING, type ScoringConfig } from '@/services/firestoreConfig'

export function useScoringConfig() {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeScoringConfig(cfg => {
      setConfig(cfg)
      setLoading(false)
    })
    return unsub
  }, [])

  return { config, loading }
}

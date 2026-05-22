import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ScoringConfig {
  exactScore: number
  correctResult: number
  exactKnockoutWithTie: number
  correctTieWinner: number
  groupBonus: number
  bonusPrediction: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  exactScore: 3,
  correctResult: 1,
  exactKnockoutWithTie: 3,
  correctTieWinner: 1,
  groupBonus: 5,
  bonusPrediction: 5,
}

export function subscribeScoringConfig(callback: (config: ScoringConfig) => void): () => void {
  return onSnapshot(doc(db, 'config', 'scoring'), snap => {
    if (snap.exists()) {
      callback({ ...DEFAULT_SCORING, ...(snap.data() as Partial<ScoringConfig>) })
    } else {
      callback(DEFAULT_SCORING)
    }
  })
}

export async function saveScoringConfig(config: ScoringConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'scoring'), config)
}

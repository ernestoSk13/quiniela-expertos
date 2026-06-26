import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ScoringConfig {
  // Modo resultado (fase de grupos)
  correctPrediction: number
  correctTieWinner: number
  groupBonus: number
  bonusPrediction: number
  // Modo marcador exacto (fases eliminatorias)
  exactScore: number
  correctResult: number
  correctGoals: number
}

export const DEFAULT_SCORING: ScoringConfig = {
  correctPrediction: 3,
  correctTieWinner: 1,
  groupBonus: 5,
  bonusPrediction: 5,
  exactScore: 5,
  correctResult: 2,
  correctGoals: 1,
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

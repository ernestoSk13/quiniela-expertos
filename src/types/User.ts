import { Timestamp } from 'firebase/firestore'
import type { ThemeId } from '@/lib/themes'

export type UserRole = 'player' | 'admin' | 'observer'

export interface BonusPredictions {
  topScorer: string
  goldenBall: string
  mexicoPhase: string
  champion: string
  pointsAwarded: boolean
}

export interface UserStats {
  totalPoints: number
  correctPredictions: number
  totalPredictions: number
  exactScoreCount?: number      // predicciones con marcador exacto (exact_score mode)
  incorrectPredictions?: number // predicciones calificadas con 0 puntos
}

export interface User {
  uid: string
  email: string
  displayName: string
  avatarUrl: string
  onboardingCompleted: boolean
  role: UserRole
  createdAt: Timestamp
  bonusPredictions: BonusPredictions
  stats: UserStats
  theme?: ThemeId
  fcmToken?: string
  currentStreak?: number
  maxStreak?: number
  timezone?: string   // IANA tz string, e.g. 'America/Mexico_City'; absent = browser auto-detect
}

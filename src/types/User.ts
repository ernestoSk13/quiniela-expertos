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
}

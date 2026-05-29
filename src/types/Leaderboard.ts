import { Timestamp } from 'firebase/firestore'

export interface LeaderboardEntry {
  userId: string
  displayName: string
  avatarUrl: string
  totalPoints: number
  correctPredictions: number
  rank: number
}

export interface Leaderboard {
  updatedAt: Timestamp
  rankings: LeaderboardEntry[]
}

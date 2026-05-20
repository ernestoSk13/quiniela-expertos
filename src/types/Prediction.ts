import { Timestamp } from 'firebase/firestore'

export interface Prediction {
  id: string
  userId: string
  matchId: string
  matchdayId: string
  homeScore: number
  awayScore: number
  /** Código ISO del equipo que avanza. Solo aplica en eliminatorias con empate pronosticado. */
  tieWinner: string | null
  submittedAt: Timestamp
  updatedAt: Timestamp
  points: number | null
  isExact: boolean | null
  isCorrectResult: boolean | null
}

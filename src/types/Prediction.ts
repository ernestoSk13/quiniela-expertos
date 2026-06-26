import { Timestamp } from 'firebase/firestore'

export type PredictionResult = 'home' | 'draw' | 'away'

export interface Prediction {
  id: string
  userId: string
  matchId: string
  matchdayId: string
  result: PredictionResult | null
  /** Código ISO del equipo que avanza. Solo aplica en eliminatorias con result === 'draw'. */
  tieWinner: string | null
  /** Goles del equipo local. Solo en jornadas con predictionMode === 'exact_score'. */
  homeGoals: number | null
  /** Goles del equipo visitante. Solo en jornadas con predictionMode === 'exact_score'. */
  awayGoals: number | null
  submittedAt: Timestamp
  updatedAt: Timestamp
  points: number | null
  isCorrect: boolean | null
}

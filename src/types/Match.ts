import { Timestamp } from 'firebase/firestore'
import type { TournamentPhase } from './Matchday'

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Match {
  id: string
  matchdayId: string
  homeTeam: string
  awayTeam: string
  homeTeamCode: string
  awayTeamCode: string
  scheduledAt: Timestamp
  status: MatchStatus
  homeScore: number | null
  awayScore: number | null
  /** Equipo que avanzó. Solo aplica en fases eliminatorias con empate al 90'. */
  winner: string | null
  phase: TournamentPhase
  group: string | null
  venue: string | null
}

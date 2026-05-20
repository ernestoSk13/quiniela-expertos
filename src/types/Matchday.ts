import { Timestamp } from 'firebase/firestore'

export type TournamentPhase =
  | 'group_stage'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinals'
  | 'semifinals'
  | 'third_place'
  | 'final'

export type MatchdayStatus = 'upcoming' | 'open' | 'closed' | 'finished'

export interface Matchday {
  id: string
  name: string
  phase: TournamentPhase
  order: number
  startDate: Timestamp
  endDate: Timestamp
  predictionDeadline: Timestamp
  status: MatchdayStatus
}

export interface Team {
  id: string
  name: string
  flag: string
  group: string | null
  groupPoints: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

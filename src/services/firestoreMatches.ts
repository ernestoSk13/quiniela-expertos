import { collection, doc, getDocs, query, updateDoc, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Match } from '@/types'

export async function getFinishedMatches(): Promise<Match[]> {
  const q = query(collection(db, 'matches'), where('status', '==', 'finished'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id }) as Match)
}

export async function saveMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
  winner: string | null,
): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), {
    homeScore,
    awayScore,
    winner,
    status: 'finished',
  })
}

export async function updateMatchDetails(
  matchId: string,
  data: { homeTeam: string; homeTeamCode: string; awayTeam: string; awayTeamCode: string; scheduledAt: Date },
): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), {
    ...data,
    scheduledAt: Timestamp.fromDate(data.scheduledAt),
  })
}

export async function clearMatchResult(matchId: string): Promise<void> {
  await updateDoc(doc(db, 'matches', matchId), {
    homeScore: null,
    awayScore: null,
    winner: null,
    status: 'upcoming',
  })
}

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Prediction } from '@/types'

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const q = query(collection(db, 'predictions'), where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Prediction)
}

export async function getPredictionCountsByUser(): Promise<Record<string, number>> {
  const snap = await getDocs(collection(db, 'predictions'))
  const counts: Record<string, number> = {}
  snap.docs.forEach(d => {
    const uid = d.data().userId as string
    counts[uid] = (counts[uid] ?? 0) + 1
  })
  return counts
}

export function predictionId(userId: string, matchId: string): string {
  return `${userId}_${matchId}`
}

export interface PredictionDraft {
  matchId: string
  matchdayId: string
  homeScore: number
  awayScore: number
  tieWinner: string | null
}

export async function savePredictions(
  userId: string,
  drafts: PredictionDraft[],
  existing: Record<string, Prediction>,
): Promise<void> {
  const SIZE = 499
  const chunks: PredictionDraft[][] = []
  for (let i = 0; i < drafts.length; i += SIZE) {
    chunks.push(drafts.slice(i, i + SIZE))
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db)
    for (const draft of chunk) {
      const id = predictionId(userId, draft.matchId)
      const ref = doc(collection(db, 'predictions'), id)
      const isNew = !existing[draft.matchId]
      batch.set(ref, {
        id,
        userId,
        matchId: draft.matchId,
        matchdayId: draft.matchdayId,
        homeScore: draft.homeScore,
        awayScore: draft.awayScore,
        tieWinner: draft.tieWinner,
        submittedAt: isNew ? serverTimestamp() : existing[draft.matchId].submittedAt,
        updatedAt: serverTimestamp(),
        points: null,
        isExact: null,
        isCorrectResult: null,
      })
    }
    await batch.commit()
  }
}

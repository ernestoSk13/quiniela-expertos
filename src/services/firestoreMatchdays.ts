import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MatchdayStatus } from '@/types'

export async function updateMatchdayStatus(id: string, status: MatchdayStatus): Promise<void> {
  await updateDoc(doc(db, 'matchdays', id), { status })
}

export async function updateMatchdayDeadline(id: string, predictionDeadline: Date): Promise<void> {
  await updateDoc(doc(db, 'matchdays', id), { predictionDeadline })
}

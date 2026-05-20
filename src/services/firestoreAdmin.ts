import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

type BatchOp = (batch: ReturnType<typeof writeBatch>) => void

async function commitInBatches(ops: BatchOp[]): Promise<void> {
  const SIZE = 499
  for (let i = 0; i < ops.length; i += SIZE) {
    const batch = writeBatch(db)
    ops.slice(i, i + SIZE).forEach(fn => fn(batch))
    await batch.commit()
  }
}

export async function resetAllData(): Promise<void> {
  const ops: BatchOp[] = []

  // Reset non-admin users: zero out stats + clear bonus predictions
  const usersSnap = await getDocs(collection(db, 'users'))
  for (const snap of usersSnap.docs) {
    if (snap.data().role === 'admin') continue
    ops.push(batch =>
      batch.update(doc(db, 'users', snap.id), {
        onboardingCompleted: false,
        stats: {
          totalPoints: 0,
          exactPredictions: 0,
          correctPredictions: 0,
          totalPredictions: 0,
        },
        bonusPredictions: {
          topScorer: '',
          goldenBall: '',
          mexicoPhase: '',
          champion: '',
          pointsAwarded: false,
        },
      }),
    )
  }

  // Reset match scores — keep scheduledAt, teams, venue, group, phase
  const matchesSnap = await getDocs(collection(db, 'matches'))
  for (const snap of matchesSnap.docs) {
    ops.push(batch =>
      batch.update(doc(db, 'matches', snap.id), {
        homeScore: null,
        awayScore: null,
        winner: null,
        status: 'upcoming',
      }),
    )
  }

  // Reset matchday statuses
  const matchdaysSnap = await getDocs(collection(db, 'matchdays'))
  for (const snap of matchdaysSnap.docs) {
    ops.push(batch =>
      batch.update(doc(db, 'matchdays', snap.id), { status: 'upcoming' }),
    )
  }

  // Delete all predictions
  const predictionsSnap = await getDocs(collection(db, 'predictions'))
  for (const snap of predictionsSnap.docs) {
    ops.push(batch => batch.delete(doc(db, 'predictions', snap.id)))
  }

  await commitInBatches(ops)
}

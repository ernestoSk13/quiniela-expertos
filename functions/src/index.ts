import * as admin from 'firebase-admin'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'

admin.initializeApp()
const db = admin.firestore()

interface MatchData {
  id: string
  phase: string
  homeScore: number | null
  awayScore: number | null
  winner: string | null
  status: string
}

interface PredictionData {
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
  tieWinner: string | null
  points: number | null
  isExact: boolean | null
  isCorrectResult: boolean | null
}

interface PointsResult {
  points: number
  isExact: boolean
  isCorrectResult: boolean
}

function computePoints(
  homeScore: number,
  awayScore: number,
  winner: string | null,
  phase: string,
  predHome: number,
  predAway: number,
  predTieWinner: string | null,
): PointsResult {
  const isKnockout = phase !== 'group_stage'
  const isDraw = homeScore === awayScore

  // Knockout draw at 90': exact = score + tieWinner, correct = tieWinner only
  if (isKnockout && isDraw) {
    const rightTie = winner != null && predTieWinner === winner
    const rightScore = predHome === homeScore && predAway === awayScore
    if (rightScore && rightTie) return { points: 3, isExact: true, isCorrectResult: true }
    if (rightTie) return { points: 1, isExact: false, isCorrectResult: true }
    return { points: 0, isExact: false, isCorrectResult: false }
  }

  // Group stage or knockout non-draw: exact = score, correct = result (G/E/P or winner)
  if (predHome === homeScore && predAway === awayScore) {
    return { points: 3, isExact: true, isCorrectResult: true }
  }

  let rightResult: boolean
  if (isDraw) {
    rightResult = predHome === predAway
  } else {
    const homeWon = homeScore > awayScore
    rightResult = homeWon ? predHome > predAway : predHome < predAway
  }

  if (rightResult) return { points: 1, isExact: false, isCorrectResult: true }
  return { points: 0, isExact: false, isCorrectResult: false }
}

async function scoreMatchPredictions(match: MatchData): Promise<void> {
  const { homeScore, awayScore, winner } = match
  if (homeScore == null || awayScore == null) return

  const predsSnap = await db.collection('predictions')
    .where('matchId', '==', match.id)
    .get()

  if (predsSnap.empty) return

  const batch = db.batch()
  for (const predDoc of predsSnap.docs) {
    const pred = predDoc.data() as PredictionData
    const result = computePoints(
      homeScore, awayScore, winner, match.phase,
      pred.homeScore, pred.awayScore, pred.tieWinner,
    )
    batch.update(predDoc.ref, {
      points: result.points,
      isExact: result.isExact,
      isCorrectResult: result.isCorrectResult,
    })
    batch.update(db.collection('users').doc(pred.userId), {
      'stats.totalPoints': FieldValue.increment(result.points),
      'stats.exactPredictions': FieldValue.increment(result.isExact ? 1 : 0),
      'stats.correctPredictions': FieldValue.increment(result.isCorrectResult ? 1 : 0),
    })
  }
  await batch.commit()
}

async function resetMatchPredictions(matchId: string): Promise<void> {
  const predsSnap = await db.collection('predictions')
    .where('matchId', '==', matchId)
    .get()

  const scored = predsSnap.docs.filter(d => d.data().points != null)
  if (scored.length === 0) return

  const batch = db.batch()
  for (const predDoc of scored) {
    const pred = predDoc.data() as PredictionData
    const pts = pred.points ?? 0
    batch.update(predDoc.ref, { points: null, isExact: null, isCorrectResult: null })
    batch.update(db.collection('users').doc(pred.userId), {
      'stats.totalPoints': FieldValue.increment(-pts),
      'stats.exactPredictions': FieldValue.increment(pred.isExact ? -1 : 0),
      'stats.correctPredictions': FieldValue.increment(pred.isCorrectResult ? -1 : 0),
    })
  }
  await batch.commit()
}

async function rescoreMatchPredictions(oldMatch: MatchData, newMatch: MatchData): Promise<void> {
  const { homeScore: newHome, awayScore: newAway, winner: newWinner } = newMatch
  if (newHome == null || newAway == null) return

  const predsSnap = await db.collection('predictions')
    .where('matchId', '==', newMatch.id)
    .get()

  if (predsSnap.empty) return

  const batch = db.batch()
  for (const predDoc of predsSnap.docs) {
    const pred = predDoc.data() as PredictionData
    const newResult = computePoints(
      newHome, newAway, newWinner, newMatch.phase,
      pred.homeScore, pred.awayScore, pred.tieWinner,
    )
    const oldPts = pred.points ?? 0
    const ptsDelta = newResult.points - oldPts
    const exactDelta = (newResult.isExact ? 1 : 0) - (pred.isExact ? 1 : 0)
    const correctDelta = (newResult.isCorrectResult ? 1 : 0) - (pred.isCorrectResult ? 1 : 0)

    batch.update(predDoc.ref, {
      points: newResult.points,
      isExact: newResult.isExact,
      isCorrectResult: newResult.isCorrectResult,
    })
    if (ptsDelta !== 0 || exactDelta !== 0 || correctDelta !== 0) {
      batch.update(db.collection('users').doc(pred.userId), {
        'stats.totalPoints': FieldValue.increment(ptsDelta),
        'stats.exactPredictions': FieldValue.increment(exactDelta),
        'stats.correctPredictions': FieldValue.increment(correctDelta),
      })
    }
  }
  await batch.commit()
}

// Awards +5pts to user(s) with most exact group stage predictions once all are finished.
async function checkAndAwardGroupBonus(): Promise<void> {
  const configRef = db.collection('config').doc('tournament')
  const configSnap = await configRef.get()
  if (configSnap.data()?.groupBonusAwarded) return

  const matchesSnap = await db.collection('matches')
    .where('phase', '==', 'group_stage')
    .get()

  const allFinished = matchesSnap.docs.length > 0 &&
    matchesSnap.docs.every(d => d.data().status === 'finished')
  if (!allFinished) return

  // Atomically claim the award to prevent double-awarding on concurrent invocations
  let claimed = false
  await db.runTransaction(async tx => {
    const snap = await tx.get(configRef)
    if (snap.data()?.groupBonusAwarded) return
    tx.set(configRef, { groupBonusAwarded: true }, { merge: true })
    claimed = true
  })
  if (!claimed) return

  const matchIds = matchesSnap.docs.map(d => d.id)
  const exactCountsByUser: Record<string, number> = {}
  const CHUNK = 30
  for (let i = 0; i < matchIds.length; i += CHUNK) {
    const chunk = matchIds.slice(i, i + CHUNK)
    const predsSnap = await db.collection('predictions')
      .where('matchId', 'in', chunk)
      .where('isExact', '==', true)
      .get()
    predsSnap.docs.forEach(d => {
      const uid = d.data().userId as string
      exactCountsByUser[uid] = (exactCountsByUser[uid] ?? 0) + 1
    })
  }

  if (Object.keys(exactCountsByUser).length === 0) return

  const maxExact = Math.max(...Object.values(exactCountsByUser))
  const winners = Object.entries(exactCountsByUser)
    .filter(([, count]) => count === maxExact)
    .map(([uid]) => uid)

  const batch = db.batch()
  for (const uid of winners) {
    batch.update(db.collection('users').doc(uid), {
      'stats.totalPoints': FieldValue.increment(5),
    })
  }
  await batch.commit()
}

export const onMatchUpdated = onDocumentUpdated('matches/{matchId}', async event => {
  const oldMatch = event.data?.before.data() as MatchData | undefined
  const newMatch = event.data?.after.data() as MatchData | undefined
  if (!oldMatch || !newMatch) return

  const wasFinished = oldMatch.status === 'finished' &&
    oldMatch.homeScore != null && oldMatch.awayScore != null
  const isFinished = newMatch.status === 'finished' &&
    newMatch.homeScore != null && newMatch.awayScore != null

  if (!wasFinished && !isFinished) return

  if (!wasFinished && isFinished) {
    await scoreMatchPredictions(newMatch)
    if (newMatch.phase === 'group_stage') {
      await checkAndAwardGroupBonus()
    }
  } else if (wasFinished && !isFinished) {
    await resetMatchPredictions(oldMatch.id)
  } else {
    const scoresChanged =
      oldMatch.homeScore !== newMatch.homeScore ||
      oldMatch.awayScore !== newMatch.awayScore ||
      oldMatch.winner !== newMatch.winner
    if (scoresChanged) {
      await rescoreMatchPredictions(oldMatch, newMatch)
    }
  }
})

export const evaluateBonusPredictions = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Not authenticated')

  const callerDoc = await db.collection('users').doc(request.auth.uid).get()
  if (callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admins only')
  }

  const { topScorer, goldenBall, mexicoPhase, champion } = request.data as {
    topScorer: string
    goldenBall: string
    mexicoPhase: string
    champion: string
  }
  if (!topScorer || !goldenBall || !mexicoPhase || !champion) {
    throw new HttpsError('invalid-argument', 'Faltan campos requeridos')
  }

  const normalize = (s: string) => (s ?? '').trim().toLowerCase()

  const usersSnap = await db.collection('users').get()
  const batch = db.batch()
  for (const userDoc of usersSnap.docs) {
    const bp = userDoc.data().bonusPredictions
    if (!bp || bp.pointsAwarded) continue

    let pts = 0
    if (normalize(bp.topScorer) === normalize(topScorer)) pts += 5
    if (normalize(bp.goldenBall) === normalize(goldenBall)) pts += 5
    if (bp.mexicoPhase === mexicoPhase) pts += 5
    if (bp.champion === champion) pts += 5

    batch.update(userDoc.ref, {
      'bonusPredictions.pointsAwarded': true,
      'stats.totalPoints': FieldValue.increment(pts),
    })
  }

  await batch.commit()
  return { success: true }
})

import * as admin from 'firebase-admin'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { FieldValue } from 'firebase-admin/firestore'

admin.initializeApp()
const db = admin.firestore()

interface MatchData {
  id: string
  matchdayId: string
  phase: string
  homeScore: number | null
  awayScore: number | null
  winner: string | null
  status: string
}

type PredictionResult = 'home' | 'draw' | 'away'
type PredictionMode = 'result' | 'exact_score'

interface PredictionData {
  userId: string
  matchId: string
  result: PredictionResult | null
  tieWinner: string | null
  homeGoals: number | null
  awayGoals: number | null
  points: number | null
  isCorrect: boolean | null
}

interface ScoringConfig {
  correctPrediction: number
  correctTieWinner: number
  groupBonus: number
  bonusPrediction: number
  exactScore: number
  correctResult: number
  correctGoals: number
}

const DEFAULT_SCORING: ScoringConfig = {
  correctPrediction: 3,
  correctTieWinner: 1,
  groupBonus: 5,
  bonusPrediction: 5,
  exactScore: 5,
  correctResult: 2,
  correctGoals: 1,
}

async function getScoringConfig(): Promise<ScoringConfig> {
  const snap = await db.collection('config').doc('scoring').get()
  if (!snap.exists) return DEFAULT_SCORING
  return { ...DEFAULT_SCORING, ...(snap.data() as Partial<ScoringConfig>) }
}

interface PointsResult {
  points: number
  isCorrect: boolean
}

function deriveResult(homeScore: number, awayScore: number): PredictionResult {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

async function getMatchdayPredictionMode(matchdayId: string): Promise<PredictionMode> {
  const snap = await db.collection('matchdays').doc(matchdayId).get()
  return (snap.data()?.predictionMode as PredictionMode | undefined) ?? 'result'
}

function computePoints(
  homeScore: number,
  awayScore: number,
  winner: string | null,
  phase: string,
  predResult: PredictionResult | null,
  predTieWinner: string | null,
  cfg: ScoringConfig,
): PointsResult {
  if (!predResult) return { points: 0, isCorrect: false }

  const matchResult = deriveResult(homeScore, awayScore)
  const isKnockout = phase !== 'group_stage'
  const isCorrect = predResult === matchResult

  if (isKnockout && matchResult === 'draw') {
    if (!isCorrect) return { points: 0, isCorrect: false }
    const rightTie = winner != null && predTieWinner === winner
    return { points: cfg.correctPrediction + (rightTie ? cfg.correctTieWinner : 0), isCorrect: true }
  }

  if (isCorrect) return { points: cfg.correctPrediction, isCorrect: true }
  return { points: 0, isCorrect: false }
}

function computeExactScorePoints(
  homeScore: number,
  awayScore: number,
  winner: string | null,
  phase: string,
  predHomeGoals: number | null,
  predAwayGoals: number | null,
  predTieWinner: string | null,
  cfg: ScoringConfig,
): PointsResult {
  if (predHomeGoals === null || predAwayGoals === null) return { points: 0, isCorrect: false }

  const isExact = predHomeGoals === homeScore && predAwayGoals === awayScore
  const isKnockout = phase !== 'group_stage'
  const actualResult = deriveResult(homeScore, awayScore)

  if (isExact) {
    let pts = cfg.exactScore
    if (isKnockout && actualResult === 'draw') {
      const rightTie = winner != null && predTieWinner === winner
      if (rightTie) pts += cfg.correctTieWinner
    }
    return { points: pts, isCorrect: true }
  }

  const predictedResult = deriveResult(predHomeGoals, predAwayGoals)
  let pts = 0

  if (predictedResult === actualResult) {
    pts += cfg.correctResult
    if (isKnockout && actualResult === 'draw') {
      const rightTie = winner != null && predTieWinner === winner
      if (rightTie) pts += cfg.correctTieWinner
    }
  }
  if (predHomeGoals === homeScore) pts += cfg.correctGoals
  if (predAwayGoals === awayScore) pts += cfg.correctGoals

  return { points: pts, isCorrect: false }
}

async function scoreMatchPredictions(match: MatchData, cfg: ScoringConfig, predictionMode: PredictionMode): Promise<void> {
  const { homeScore, awayScore, winner } = match
  if (homeScore == null || awayScore == null) return

  const predsSnap = await db.collection('predictions')
    .where('matchId', '==', match.id)
    .get()

  if (predsSnap.empty) return

  const batch = db.batch()
  for (const predDoc of predsSnap.docs) {
    const pred = predDoc.data() as PredictionData
    const scored = predictionMode === 'exact_score'
      ? computeExactScorePoints(homeScore, awayScore, winner, match.phase, pred.homeGoals, pred.awayGoals, pred.tieWinner, cfg)
      : computePoints(homeScore, awayScore, winner, match.phase, pred.result, pred.tieWinner, cfg)
    batch.update(predDoc.ref, {
      points: scored.points,
      isCorrect: scored.isCorrect,
    })
    batch.update(db.collection('users').doc(pred.userId), {
      'stats.totalPoints': FieldValue.increment(scored.points),
      'stats.correctPredictions': FieldValue.increment(scored.isCorrect ? 1 : 0),
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
    batch.update(predDoc.ref, { points: null, isCorrect: null })
    batch.update(db.collection('users').doc(pred.userId), {
      'stats.totalPoints': FieldValue.increment(-pts),
      'stats.correctPredictions': FieldValue.increment(pred.isCorrect ? -1 : 0),
    })
  }
  await batch.commit()
}

async function rescoreMatchPredictions(oldMatch: MatchData, newMatch: MatchData, cfg: ScoringConfig, predictionMode: PredictionMode): Promise<void> {
  const { homeScore: newHome, awayScore: newAway, winner: newWinner } = newMatch
  if (newHome == null || newAway == null) return

  const predsSnap = await db.collection('predictions')
    .where('matchId', '==', newMatch.id)
    .get()

  if (predsSnap.empty) return

  const batch = db.batch()
  for (const predDoc of predsSnap.docs) {
    const pred = predDoc.data() as PredictionData
    const newScored = predictionMode === 'exact_score'
      ? computeExactScorePoints(newHome, newAway, newWinner, newMatch.phase, pred.homeGoals, pred.awayGoals, pred.tieWinner, cfg)
      : computePoints(newHome, newAway, newWinner, newMatch.phase, pred.result, pred.tieWinner, cfg)
    const oldPts = pred.points ?? 0
    const ptsDelta = newScored.points - oldPts
    const correctDelta = (newScored.isCorrect ? 1 : 0) - (pred.isCorrect ? 1 : 0)

    batch.update(predDoc.ref, {
      points: newScored.points,
      isCorrect: newScored.isCorrect,
    })
    if (ptsDelta !== 0 || correctDelta !== 0) {
      batch.update(db.collection('users').doc(pred.userId), {
        'stats.totalPoints': FieldValue.increment(ptsDelta),
        'stats.correctPredictions': FieldValue.increment(correctDelta),
      })
    }
  }
  await batch.commit()
}

// Awards groupBonus pts to user(s) with most exact group stage predictions once all are finished.
async function checkAndAwardGroupBonus(bonusPts: number): Promise<void> {
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
  const correctCountsByUser: Record<string, number> = {}
  const CHUNK = 30
  for (let i = 0; i < matchIds.length; i += CHUNK) {
    const chunk = matchIds.slice(i, i + CHUNK)
    const predsSnap = await db.collection('predictions')
      .where('matchId', 'in', chunk)
      .where('isCorrect', '==', true)
      .get()
    predsSnap.docs.forEach(d => {
      const uid = d.data().userId as string
      correctCountsByUser[uid] = (correctCountsByUser[uid] ?? 0) + 1
    })
  }

  if (Object.keys(correctCountsByUser).length === 0) return

  const maxCorrect = Math.max(...Object.values(correctCountsByUser))
  const winners = Object.entries(correctCountsByUser)
    .filter(([, count]) => count === maxCorrect)
    .map(([uid]) => uid)

  const batch = db.batch()
  for (const uid of winners) {
    batch.update(db.collection('users').doc(uid), {
      'stats.totalPoints': FieldValue.increment(bonusPts),
    })
  }
  await batch.commit()
}

export const onMatchUpdated = onDocumentUpdated('matches/{matchId}', async event => {
  const matchId = event.params.matchId
  const beforeData = event.data?.before.data()
  const afterData = event.data?.after.data()
  if (!beforeData || !afterData) return

  const oldMatch: MatchData = { ...(beforeData as Omit<MatchData, 'id'>), id: matchId, matchdayId: beforeData.matchdayId ?? '' }
  const newMatch: MatchData = { ...(afterData as Omit<MatchData, 'id'>), id: matchId, matchdayId: afterData.matchdayId ?? '' }

  const wasFinished = oldMatch.status === 'finished' &&
    oldMatch.homeScore != null && oldMatch.awayScore != null
  const isFinished = newMatch.status === 'finished' &&
    newMatch.homeScore != null && newMatch.awayScore != null

  if (!wasFinished && !isFinished) return

  const [cfg, predictionMode] = await Promise.all([
    getScoringConfig(),
    getMatchdayPredictionMode(newMatch.matchdayId),
  ])

  if (!wasFinished && isFinished) {
    await scoreMatchPredictions(newMatch, cfg, predictionMode)
    if (newMatch.phase === 'group_stage') {
      await checkAndAwardGroupBonus(cfg.groupBonus)
    }
  } else if (wasFinished && !isFinished) {
    await resetMatchPredictions(oldMatch.id)
  } else {
    const scoresChanged =
      oldMatch.homeScore !== newMatch.homeScore ||
      oldMatch.awayScore !== newMatch.awayScore ||
      oldMatch.winner !== newMatch.winner
    if (scoresChanged) {
      await rescoreMatchPredictions(oldMatch, newMatch, cfg, predictionMode)
    }
  }
})

export const getInvite = onCall(async request => {
  const { token } = request.data as { token?: string }
  if (!token) throw new HttpsError('invalid-argument', 'Token requerido')

  const snap = await db.collection('invites').doc(token).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Invitación no válida')

  const data = snap.data()!
  if ((data.expiresAt as admin.firestore.Timestamp).toDate() < new Date()) {
    throw new HttpsError('deadline-exceeded', 'Invitación expirada')
  }

  return { email: data.email as string }
})

// ── Push notification helpers ─────────────────────────────────────────────────

async function getFcmTokens(): Promise<string[]> {
  const snap = await db.collection('users').get()
  return snap.docs
    .map(d => d.data().fcmToken as string | undefined)
    .filter((t): t is string => !!t)
}

async function sendPush(
  tokens: string[],
  title: string,
  body: string,
): Promise<void> {
  if (tokens.length === 0) return

  const result = await admin.messaging().sendEachForMulticast({ tokens, notification: { title, body } })

  // Limpiar tokens inválidos de Firestore
  const invalidTokens = result.responses
    .map((r, i) => (!r.success ? tokens[i] : null))
    .filter((t): t is string => !!t)

  if (invalidTokens.length > 0) {
    const usersSnap = await db.collection('users')
      .where('fcmToken', 'in', invalidTokens)
      .get()
    const batch = db.batch()
    usersSnap.docs.forEach(d => batch.update(d.ref, { fcmToken: FieldValue.delete() }))
    await batch.commit()
  }
}

// Corre cada hora — avisa cuando falta ~1h para el cierre de una jornada abierta
export const sendDeadlineReminders = onSchedule('every 60 minutes', async () => {
  const now = new Date()
  const windowStart = new Date(now.getTime() + 50 * 60 * 1000)  // 50 min desde ahora
  const windowEnd   = new Date(now.getTime() + 70 * 60 * 1000)  // 70 min desde ahora

  const matchdaysSnap = await db.collection('matchdays')
    .where('status', '==', 'open')
    .get()

  for (const mdDoc of matchdaysSnap.docs) {
    const md = mdDoc.data()
    const deadline = (md.predictionDeadline as admin.firestore.Timestamp)?.toDate()
    if (!deadline) continue
    if (deadline < windowStart || deadline > windowEnd) continue

    const tokens = await getFcmTokens()
    await sendPush(
      tokens,
      '⏰ ¡Cierre pronto!',
      `${md.name} cierra en 1 hora — completa tus pronósticos`,
    )
  }
})

// Se dispara cuando cambia el estado de una jornada → avisa al pasar a 'closed' o 'finished'
export const notifyResultsPublished = onDocumentUpdated('matchdays/{matchdayId}', async event => {
  const before = event.data?.before.data()
  const after  = event.data?.after.data()
  if (!before || !after) return

  const wasOpen = before.status === 'open' || before.status === 'upcoming'
  const isClosed = after.status === 'closed' || after.status === 'finished'
  if (!wasOpen || !isClosed) return

  const tokens = await getFcmTokens()
  await sendPush(
    tokens,
    '🏆 Resultados disponibles',
    `Los resultados de ${after.name} ya están publicados`,
  )
})

export const sendMassNotification = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Not authenticated')

  const callerDoc = await db.collection('users').doc(request.auth.uid).get()
  if (callerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admins only')
  }

  const { title, body } = request.data as { title?: string; body?: string }
  if (!title?.trim() || !body?.trim()) {
    throw new HttpsError('invalid-argument', 'Título y mensaje requeridos')
  }

  const tokens = await getFcmTokens()
  await sendPush(tokens, title.trim(), body.trim())

  return { sent: tokens.length }
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

  const cfg = await getScoringConfig()
  const bonusPts = cfg.bonusPrediction
  const normalize = (s: string) => (s ?? '').trim().toLowerCase()

  const usersSnap = await db.collection('users').get()
  const batch = db.batch()
  for (const userDoc of usersSnap.docs) {
    const bp = userDoc.data().bonusPredictions
    if (!bp || bp.pointsAwarded) continue

    let pts = 0
    if (normalize(bp.topScorer) === normalize(topScorer)) pts += bonusPts
    if (normalize(bp.goldenBall) === normalize(goldenBall)) pts += bonusPts
    if (bp.mexicoPhase === mexicoPhase) pts += bonusPts
    if (bp.champion === champion) pts += bonusPts

    batch.update(userDoc.ref, {
      'bonusPredictions.pointsAwarded': true,
      'stats.totalPoints': FieldValue.increment(pts),
    })
  }

  await batch.commit()
  return { success: true }
})

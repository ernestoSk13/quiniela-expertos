#!/usr/bin/env tsx
/**
 * Backfill script — rellena exactScoreCount e incorrectPredictions en los stats
 * de cada jugador para partidos calificados antes del deploy de T21.
 *
 * Solo afecta predicciones con predictionMode === 'exact_score' donde
 * isExact === null (marcador de "pre-T21") y points !== null (ya calificadas).
 *
 * Emulador:    npm run backfill:exact-scores
 * Producción:  npm run backfill:exact-scores:prod
 *
 * Es idempotente: si se corre dos veces, la segunda no hace nada porque
 * ya no habrá predicciones con isExact === null.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const PROJECT_ID = 'quinielaexpertos26'
const isProd = !process.env.FIRESTORE_EMULATOR_HOST

if (isProd) {
  const SA_FILE = join(process.cwd(), 'service-account.json')
  let serviceAccount: object
  if (existsSync(SA_FILE)) {
    serviceAccount = JSON.parse(readFileSync(SA_FILE, 'utf8'))
    console.log('🔑 Usando service-account.json')
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } else {
    console.error('❌ No se encontró service-account.json ni FIREBASE_SERVICE_ACCOUNT.')
    process.exit(1)
  }
  initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId: PROJECT_ID })
  console.log('🌐 Apuntando a producción\n')
} else {
  initializeApp({ projectId: PROJECT_ID })
  console.log('🧪 Apuntando al emulador\n')
}

const db = getFirestore()

interface MatchDoc {
  id: string
  matchdayId: string
  homeScore: number
  awayScore: number
  status: string
}

interface PredictionDoc {
  id: string
  userId: string
  matchId: string
  homeGoals: number | null
  awayGoals: number | null
  points: number | null
  isExact: boolean | null
}

interface UserDelta {
  exactScoreCount: number
  incorrectPredictions: number
}

async function main() {
  console.log('🔍 Buscando jornadas con predictionMode: exact_score...')

  // 1. Obtener todas las jornadas con exact_score
  const matchdaysSnap = await db.collection('matchdays')
    .where('predictionMode', '==', 'exact_score')
    .get()

  if (matchdaysSnap.empty) {
    console.log('  No hay jornadas exact_score. Nada que hacer.')
    process.exit(0)
  }

  const matchdayIds = matchdaysSnap.docs.map(d => d.id)
  console.log(`  Jornadas: ${matchdayIds.join(', ')}`)

  // 2. Obtener todos los partidos finalizados de esas jornadas
  const finishedMatches: MatchDoc[] = []
  for (const mdId of matchdayIds) {
    const snap = await db.collection('matches')
      .where('matchdayId', '==', mdId)
      .where('status', '==', 'finished')
      .get()
    snap.docs.forEach(d => {
      const data = d.data()
      if (data.homeScore != null && data.awayScore != null) {
        finishedMatches.push({ id: d.id, matchdayId: mdId, homeScore: data.homeScore, awayScore: data.awayScore, status: data.status })
      }
    })
  }

  if (finishedMatches.length === 0) {
    console.log('\n  No hay partidos finalizados con exact_score. Nada que hacer.')
    process.exit(0)
  }

  console.log(`\n⚽ Partidos finalizados a backfillear: ${finishedMatches.length}`)

  // 3. Para cada partido, obtener predicciones pre-T21 (isExact === null, points !== null)
  const userDeltas: Record<string, UserDelta> = {}
  const predUpdates: Array<{ ref: FirebaseFirestore.DocumentReference; isExact: boolean }> = []

  for (const match of finishedMatches) {
    const predsSnap = await db.collection('predictions')
      .where('matchId', '==', match.id)
      .get()

    const preTZ1 = predsSnap.docs.filter(d => {
      const pred = d.data()
      return pred.isExact == null && pred.points != null
    })

    if (preTZ1.length === 0) {
      console.log(`  ${match.id}: ya backfilleado (0 predicciones pre-T21)`)
      continue
    }

    let exactCount = 0
    let falloCount = 0

    for (const predDoc of preTZ1) {
      const pred = predDoc.data() as PredictionDoc
      const isExact = pred.homeGoals === match.homeScore && pred.awayGoals === match.awayScore
      const isFallo = (pred.points ?? 0) === 0

      predUpdates.push({ ref: predDoc.ref, isExact })

      if (!userDeltas[pred.userId]) userDeltas[pred.userId] = { exactScoreCount: 0, incorrectPredictions: 0 }
      userDeltas[pred.userId].exactScoreCount += isExact ? 1 : 0
      userDeltas[pred.userId].incorrectPredictions += isFallo ? 1 : 0

      if (isExact) exactCount++
      if (isFallo) falloCount++
    }

    console.log(`  ${match.id} (${match.homeScore}-${match.awayScore}): ${preTZ1.length} predicciones — ${exactCount} exactas, ${falloCount} fallos`)
  }

  if (predUpdates.length === 0) {
    console.log('\n✅ Todo ya estaba backfilleado. Nada que actualizar.')
    process.exit(0)
  }

  // 4. Escribir en batches (max 499 ops por batch)
  console.log(`\n✍️  Actualizando ${predUpdates.length} predicciones y ${Object.keys(userDeltas).length} jugadores...`)

  const allWrites: Array<() => void> = []

  // Predicciones: marcar isExact
  let batch = db.batch()
  let ops = 0
  for (const { ref, isExact } of predUpdates) {
    batch.update(ref, { isExact })
    ops++
    if (ops === 499) {
      await batch.commit()
      batch = db.batch()
      ops = 0
    }
  }

  // Stats de usuarios
  for (const [uid, delta] of Object.entries(userDeltas)) {
    const userRef = db.collection('users').doc(uid)
    const update: Record<string, FirebaseFirestore.FieldValue> = {}
    if (delta.exactScoreCount > 0)
      update['stats.exactScoreCount'] = FieldValue.increment(delta.exactScoreCount)
    if (delta.incorrectPredictions > 0)
      update['stats.incorrectPredictions'] = FieldValue.increment(delta.incorrectPredictions)
    if (Object.keys(update).length > 0) {
      batch.update(userRef, update)
      ops++
      if (ops === 499) {
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }
  }

  if (ops > 0) await batch.commit()

  // 5. Resumen
  console.log('\n📊 Resumen por jugador:')
  for (const [uid, delta] of Object.entries(userDeltas)) {
    console.log(`  ${uid}: +${delta.exactScoreCount} exactos 🎯  +${delta.incorrectPredictions} fallos ❌`)
  }

  console.log('\n✅ Backfill completado.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en backfill:', err)
  process.exit(1)
})

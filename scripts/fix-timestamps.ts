#!/usr/bin/env tsx
/**
 * Corrige los timestamps de matchdays y matches sumándoles un offset en horas.
 *
 * Contexto: los tiempos fueron ingresados como hora local (CDMX, UTC-6)
 * pero Firestore los guardó como UTC sin conversión. Este script suma el
 * offset necesario para que los timestamps sean UTC correctos.
 *
 * Ejemplo: deadline ingresado como 09:00 (hora CDMX) → guardado como 09:00 UTC
 *          → con --offset=6 se corrige a 15:00 UTC (= 09:00 AM CDMX)
 *
 * Uso:
 *   # Preview (sin escribir nada):
 *   npm run fix-timestamps
 *
 *   # Aplicar en producción:
 *   npm run fix-timestamps -- --apply
 *
 *   # Aplicar en emulador (debe estar corriendo):
 *   npm run fix-timestamps -- --apply --emulator
 *
 *   # Offset distinto (ej. UTC-7 para Tijuana):
 *   npm run fix-timestamps -- --apply --offset=7
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, WriteBatch } from 'firebase-admin/firestore'

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const APPLY     = args.includes('--apply')
const EMULATOR  = args.includes('--emulator')
const offsetArg = args.find(a => a.startsWith('--offset='))
const OFFSET_H  = offsetArg ? parseInt(offsetArg.replace('--offset=', ''), 10) : 6
const OFFSET_MS = OFFSET_H * 60 * 60 * 1000

if (isNaN(OFFSET_H) || OFFSET_H < 0 || OFFSET_H > 14) {
  console.error('❌ --offset debe ser un número entre 0 y 14')
  process.exit(1)
}

// ── Firestore init ───────────────────────────────────────────────────────────

const PROJECT_ID = 'quinielaexpertos26'

function initDb() {
  if (EMULATOR) {
    const app = initializeApp({ projectId: PROJECT_ID }, 'emulator')
    const db = getFirestore(app)
    db.settings({ host: 'localhost:8080', ssl: false })
    return db
  }

  let serviceAccount: object
  const SA_FILE = join(process.cwd(), 'service-account.json')

  if (existsSync(SA_FILE)) {
    serviceAccount = JSON.parse(readFileSync(SA_FILE, 'utf8'))
    console.log('🔑 Usando service-account.json\n')
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } else {
    console.error('❌ No se encontró service-account.json ni FIREBASE_SERVICE_ACCOUNT.')
    process.exit(1)
  }

  const app = initializeApp(
    { credential: cert(serviceAccount as Parameters<typeof cert>[0]), projectId: PROJECT_ID },
    'prod',
  )
  return getFirestore(app)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function shiftTimestamp(ts: Timestamp): Timestamp {
  return Timestamp.fromMillis(ts.toMillis() + OFFSET_MS)
}

function fmtTs(ts: Timestamp | undefined | null): string {
  if (!ts) return '—'
  return ts.toDate().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

function arrow(before: Timestamp | undefined | null, after: Timestamp): string {
  return `${fmtTs(before)}  →  ${fmtTs(after)}`
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const target = EMULATOR ? 'emulador' : 'PRODUCCIÓN'
  const mode   = APPLY    ? `✏️  ESCRIBIR en ${target}` : `👁  PREVIEW (dry-run)`

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  fix-timestamps`)
  console.log(`  Offset: +${OFFSET_H}h   Destino: ${target}   Modo: ${mode}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (APPLY && !EMULATOR) {
    console.log('⚠️  Estás a punto de modificar datos en PRODUCCIÓN.')
    console.log('   Presiona Ctrl+C en los próximos 5 segundos para cancelar...\n')
    await new Promise(r => setTimeout(r, 5000))
  }

  const db = initDb()

  // ── Matchdays: predictionDeadline ────────────────────────────────────────

  console.log('📅 MATCHDAYS — predictionDeadline\n')
  const matchdaysSnap = await db.collection('matchdays').orderBy('order').get()

  let mdBatch: WriteBatch = db.batch()
  let mdCount = 0

  for (const doc of matchdaysSnap.docs) {
    const data = doc.data()
    const before: Timestamp | undefined = data.predictionDeadline
    if (!before) {
      console.log(`   ${doc.id}: sin predictionDeadline, se omite`)
      continue
    }
    const after = shiftTimestamp(before)
    console.log(`   ${data.name ?? doc.id}`)
    console.log(`     ${arrow(before, after)}`)

    if (APPLY) {
      mdBatch.update(doc.ref, { predictionDeadline: after })
      mdCount++
      if (mdCount % 499 === 0) {
        await mdBatch.commit()
        mdBatch = db.batch()
      }
    }
  }

  if (APPLY && mdCount > 0) {
    await mdBatch.commit()
    console.log(`\n   ✓ ${mdCount} matchday(s) actualizados`)
  }

  // ── Matches: scheduledAt ─────────────────────────────────────────────────

  console.log('\n⚽ MATCHES — scheduledAt\n')
  const matchesSnap = await db.collection('matches').orderBy('scheduledAt').get()

  let mBatch: WriteBatch = db.batch()
  let mCount = 0

  for (const doc of matchesSnap.docs) {
    const data = doc.data()
    const before: Timestamp | undefined = data.scheduledAt
    if (!before) {
      console.log(`   ${doc.id}: sin scheduledAt, se omite`)
      continue
    }
    const after = shiftTimestamp(before)
    const home = data.homeTeamId ?? '?'
    const away = data.awayTeamId ?? '?'
    console.log(`   ${home} vs ${away}`)
    console.log(`     ${arrow(before, after)}`)

    if (APPLY) {
      mBatch.update(doc.ref, { scheduledAt: after })
      mCount++
      if (mCount % 499 === 0) {
        await mBatch.commit()
        mBatch = db.batch()
      }
    }
  }

  if (APPLY && mCount > 0) {
    await mBatch.commit()
    console.log(`\n   ✓ ${mCount} match(es) actualizados`)
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (APPLY) {
    console.log(`✅ Listo. Todos los timestamps actualizados en ${target}.`)
  } else {
    console.log('👆 Esto es solo un preview. Para aplicar los cambios:')
    console.log(`   npm run fix-timestamps -- --apply${EMULATOR ? ' --emulator' : ''}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Error:', err.message ?? err)
  process.exit(1)
})

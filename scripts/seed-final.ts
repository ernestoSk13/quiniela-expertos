#!/usr/bin/env tsx
/**
 * Seed script — carga la jornada Final con el partido por el 3er Lugar (M103)
 * y la Gran Final (M104).
 *
 * Emulador:    npm run seed:final
 * Producción:  npm run seed:final:prod   (requiere service-account.json o FIREBASE_SERVICE_ACCOUNT)
 *
 * Todos los equipos son TBD hasta que terminen las Semifinales (14-15 jul).
 * El predictionDeadline es 10 min antes del Tercer Lugar (18 jul 21:00 UTC).
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

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

// ─── JORNADA ─────────────────────────────────────────────────────────────────

const MATCHDAY = {
  id:                 'final_stage',
  name:               'Gran Final',
  phase:              'final',
  order:              8,
  startDate:          Timestamp.fromDate(new Date('2026-07-18T00:00:00Z')),
  endDate:            Timestamp.fromDate(new Date('2026-07-20T00:00:00Z')),
  // Deadline = 10 min antes del Tercer Lugar (M103, 18 jul 21:00 UTC)
  predictionDeadline: Timestamp.fromDate(new Date('2026-07-18T20:50:00Z')),
  status:             'upcoming',
  predictionMode:     'exact_score',
}

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────

const TBD_CODE = 'TBD'

const MATCHES = [

  // ── 18 jul — Tercer Lugar ─────────────────────────────────────────────────────
  {
    id:          'final_m103',
    matchdayId:  'final_stage',
    homeTeam:    'Per. M101',  homeTeamCode: TBD_CODE,
    awayTeam:    'Per. M102',  awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-18T21:00:00Z')),
    venue:       'Hard Rock Stadium, Miami Gardens',
  },

  // ── 19 jul — Final ────────────────────────────────────────────────────────────
  {
    id:          'final_m104',
    matchdayId:  'final_stage',
    homeTeam:    'Gan. M101',  homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M102',  awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-19T19:00:00Z')),
    venue:       'MetLife Stadium, East Rutherford',
  },
]

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seedMatchday() {
  await db.doc(`matchdays/${MATCHDAY.id}`).set(MATCHDAY)
  console.log(`  ✓ jornada "${MATCHDAY.name}" (${MATCHDAY.id})`)
}

async function seedMatches() {
  const batch = db.batch()
  for (const match of MATCHES) {
    const { id, ...data } = match
    batch.set(db.doc(`matches/${id}`), {
      ...data,
      phase:     'final',
      group:     null,
      status:    'upcoming',
      homeScore: null,
      awayScore: null,
      winner:    null,
    })
  }
  await batch.commit()
  console.log(`  ✓ ${MATCHES.length} partidos (M103 Tercer Lugar + M104 Final, ambos TBD)`)
}

async function main() {
  console.log('🌱 Seed Final — Gran Final\n')
  await seedMatchday()
  await seedMatches()
  console.log('\n✅ Listo. Abre /admin/jornada/final_stage para editar los equipos TBD.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en seed:final:', err)
  process.exit(1)
})

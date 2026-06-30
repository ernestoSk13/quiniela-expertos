#!/usr/bin/env tsx
/**
 * Seed script — carga la jornada de Semifinales y sus 2 partidos.
 *
 * Emulador:    npm run seed:sf
 * Producción:  npm run seed:sf:prod   (requiere service-account.json o FIREBASE_SERVICE_ACCOUNT)
 *
 * Todos los equipos son TBD hasta que terminen los Cuartos (11-12 jul).
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
  id:                 'sf_stage',
  name:               'Semifinales',
  phase:              'semi_finals',
  order:              7,
  startDate:          Timestamp.fromDate(new Date('2026-07-14T00:00:00Z')),
  endDate:            Timestamp.fromDate(new Date('2026-07-16T00:00:00Z')),
  // Deadline = 10 min antes del primer partido (M101, 14 jul 19:00 UTC)
  predictionDeadline: Timestamp.fromDate(new Date('2026-07-14T18:50:00Z')),
  status:             'upcoming',
  predictionMode:     'exact_score',
}

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────

const TBD_CODE = 'TBD'

const MATCHES = [

  // ── 14 jul ───────────────────────────────────────────────────────────────────
  {
    id:          'sf_m101',
    matchdayId:  'sf_stage',
    homeTeam:    'Gan. M97',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M98',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-14T19:00:00Z')),
    venue:       'AT&T Stadium, Arlington',
  },

  // ── 15 jul ───────────────────────────────────────────────────────────────────
  {
    id:          'sf_m102',
    matchdayId:  'sf_stage',
    homeTeam:    'Gan. M99',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M100',  awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-15T19:00:00Z')),
    venue:       'Mercedes-Benz Stadium, Atlanta',
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
      phase:     'semi_finals',
      group:     null,
      status:    'upcoming',
      homeScore: null,
      awayScore: null,
      winner:    null,
    })
  }
  await batch.commit()
  console.log(`  ✓ ${MATCHES.length} partidos (0 confirmados, ${MATCHES.length} slots TBD)`)
}

async function main() {
  console.log('🌱 Seed SF — Semifinales\n')
  await seedMatchday()
  await seedMatches()
  console.log('\n✅ Listo. Abre /admin/jornada/sf_stage para editar los equipos TBD.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en seed:sf:', err)
  process.exit(1)
})

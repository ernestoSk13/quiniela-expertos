#!/usr/bin/env tsx
/**
 * Seed script — carga la jornada de Cuartos de Final y sus 4 partidos.
 *
 * Emulador:    npm run seed:qf
 * Producción:  npm run seed:qf:prod   (requiere service-account.json o FIREBASE_SERVICE_ACCOUNT)
 *
 * Todos los equipos son TBD hasta que terminen los Octavos (7 jul).
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
  id:                 'qf_stage',
  name:               'Cuartos de Final',
  phase:              'quarter_finals',
  order:              6,
  startDate:          Timestamp.fromDate(new Date('2026-07-09T00:00:00Z')),
  endDate:            Timestamp.fromDate(new Date('2026-07-12T06:00:00Z')),
  // Deadline = 10 min antes del primer partido (M97, 9 jul 20:00 UTC)
  predictionDeadline: Timestamp.fromDate(new Date('2026-07-09T19:50:00Z')),
  status:             'upcoming',
  predictionMode:     'exact_score',
}

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────

const TBD_CODE = 'TBD'

const MATCHES = [

  // ── 9 jul ────────────────────────────────────────────────────────────────────
  {
    id:          'qf_m97',
    matchdayId:  'qf_stage',
    homeTeam:    'Gan. M89',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M90',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-09T20:00:00Z')),
    venue:       'Gillette Stadium, Foxborough',
  },

  // ── 10 jul ───────────────────────────────────────────────────────────────────
  {
    id:          'qf_m98',
    matchdayId:  'qf_stage',
    homeTeam:    'Gan. M93',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M94',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-10T19:00:00Z')),
    venue:       'SoFi Stadium, Inglewood',
  },

  // ── 11 jul ───────────────────────────────────────────────────────────────────
  {
    id:          'qf_m99',
    matchdayId:  'qf_stage',
    homeTeam:    'Gan. M91',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M92',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-11T21:00:00Z')),
    venue:       'Hard Rock Stadium, Miami Gardens',
  },

  // ── 12 jul (01:00 UTC) ───────────────────────────────────────────────────────
  {
    id:          'qf_m100',
    matchdayId:  'qf_stage',
    homeTeam:    'Gan. M95',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M96',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-12T01:00:00Z')),
    venue:       'Arrowhead Stadium, Kansas City',
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
      phase:     'quarter_finals',
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
  console.log('🌱 Seed QF — Cuartos de Final\n')
  await seedMatchday()
  await seedMatches()
  console.log('\n✅ Listo. Abre /admin/jornada/qf_stage para editar los equipos TBD.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en seed:qf:', err)
  process.exit(1)
})

#!/usr/bin/env tsx
/**
 * Seed script — carga la jornada de Octavos de Final (Round of 16) y sus 8 partidos.
 *
 * Emulador:    npm run seed:r16
 * Producción:  npm run seed:r16:prod   (requiere service-account.json o FIREBASE_SERVICE_ACCOUNT)
 *
 * Los slots TBD se actualizan desde el admin una vez que terminen los 16vos.
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
  id:                 'r16_stage',
  name:               'Octavos de Final',
  phase:              'round_of_16',
  order:              5,
  startDate:          Timestamp.fromDate(new Date('2026-07-04T00:00:00Z')),
  endDate:            Timestamp.fromDate(new Date('2026-07-08T00:00:00Z')),
  // Deadline = 10 min antes del primer partido (M90 CAN vs MAR, 4 jul 17:00 UTC)
  predictionDeadline: Timestamp.fromDate(new Date('2026-07-04T16:50:00Z')),
  status:             'upcoming',
  predictionMode:     'exact_score',
}

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────

const TBD_CODE = 'TBD'

const MATCHES = [

  // ── 4 jul ────────────────────────────────────────────────────────────────────
  {
    id:          'r16_m90',
    matchdayId:  'r16_stage',
    homeTeam:    'Canadá',     homeTeamCode: 'CAN',
    awayTeam:    'Marruecos',  awayTeamCode: 'MAR',
    scheduledAt: Timestamp.fromDate(new Date('2026-07-04T17:00:00Z')),
    venue:       'NRG Stadium, Houston',
  },
  {
    id:          'r16_m89',
    matchdayId:  'r16_stage',
    homeTeam:    'Paraguay',   homeTeamCode: 'PAR',
    awayTeam:    'Gan. M77',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-04T21:00:00Z')),
    venue:       'Lincoln Financial Field, Philadelphia',
  },

  // ── 5 jul ────────────────────────────────────────────────────────────────────
  {
    id:          'r16_m91',
    matchdayId:  'r16_stage',
    homeTeam:    'Brasil',     homeTeamCode: 'BRA',
    awayTeam:    'Noruega',    awayTeamCode: 'NOR',
    scheduledAt: Timestamp.fromDate(new Date('2026-07-05T20:00:00Z')),
    venue:       'MetLife Stadium, East Rutherford',
  },

  // ── 6 jul ────────────────────────────────────────────────────────────────────
  {
    id:          'r16_m92',
    matchdayId:  'r16_stage',
    homeTeam:    'Gan. M79',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M80',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-06T00:00:00Z')),
    venue:       'Estadio Azteca, Ciudad de México',
  },
  {
    id:          'r16_m93',
    matchdayId:  'r16_stage',
    homeTeam:    'Gan. M83',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M84',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-06T19:00:00Z')),
    venue:       'AT&T Stadium, Arlington',
  },

  // ── 7 jul ────────────────────────────────────────────────────────────────────
  {
    id:          'r16_m94',
    matchdayId:  'r16_stage',
    homeTeam:    'Gan. M81',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M82',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-07T00:00:00Z')),
    venue:       'Lumen Field, Seattle',
  },
  {
    id:          'r16_m95',
    matchdayId:  'r16_stage',
    homeTeam:    'Gan. M86',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M88',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-07T16:00:00Z')),
    venue:       'Mercedes-Benz Stadium, Atlanta',
  },
  {
    id:          'r16_m96',
    matchdayId:  'r16_stage',
    homeTeam:    'Gan. M85',   homeTeamCode: TBD_CODE,
    awayTeam:    'Gan. M87',   awayTeamCode: TBD_CODE,
    scheduledAt: Timestamp.fromDate(new Date('2026-07-07T20:00:00Z')),
    venue:       'BC Place, Vancouver',
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
      phase:     'round_of_16',
      group:     null,
      status:    'upcoming',
      homeScore: null,
      awayScore: null,
      winner:    null,
    })
  }
  await batch.commit()

  const confirmed = MATCHES.filter(m => m.homeTeamCode !== TBD_CODE && m.awayTeamCode !== TBD_CODE)
  const tbd       = MATCHES.length - confirmed.length
  console.log(`  ✓ ${MATCHES.length} partidos (${confirmed.length} confirmados, ${tbd} slots TBD)`)
}

async function main() {
  console.log('🌱 Seed R16 — Octavos de Final\n')
  await seedMatchday()
  await seedMatches()
  console.log('\n✅ Listo. Abre /admin/jornada/r16_stage para editar los equipos TBD.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en seed:r16:', err)
  process.exit(1)
})

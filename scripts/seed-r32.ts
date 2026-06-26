#!/usr/bin/env tsx
/**
 * Seed script — carga la jornada de 16vos de final (Round of 32) y sus 16 partidos.
 *
 * Requiere emuladores corriendo: npm run emulators
 * Uso: npm run seed:r32
 *
 * Los equipos marcados como 'TBD' se actualizan desde el admin una vez que
 * terminé la fase de grupos y se conozcan los clasificados.
 * Los equipos confirmados ya existen en la colección `teams` del seed principal.
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

initializeApp({ projectId: 'quinielaexpertos26' })
const db = getFirestore()

// ─── JORNADA ─────────────────────────────────────────────────────────────────

const MATCHDAY = {
  id:                 'r32_stage',
  name:               '16vos de Final',
  phase:              'round_of_32',
  order:              4,
  startDate:          Timestamp.fromDate(new Date('2026-06-28T00:00:00Z')),
  endDate:            Timestamp.fromDate(new Date('2026-07-05T00:00:00Z')),
  // Deadline = 10 min antes del primer partido (M73 RSA vs CAN, 28 jun 19:00 UTC)
  predictionDeadline: Timestamp.fromDate(new Date('2026-06-28T18:50:00Z')),
  status:             'upcoming',
  predictionMode:     'exact_score',
}

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────
// Los slots TBD usan código 'TBD' para que el admin los pueda editar desde
// /admin/jornada/r32_stage una vez definidos los clasificados.
// homeTeam / awayTeam contienen la descripción del slot para referencia visual.

const TBD_CODE = 'TBD'

const MATCHES = [

  // ── 28 jun ───────────────────────────────────────────────────────────────────
  {
    id:           'r32_m73',
    matchdayId:   'r32_stage',
    homeTeam:     'Sudáfrica',    homeTeamCode: 'RSA',
    awayTeam:     'Canadá',       awayTeamCode: 'CAN',
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-28T19:00:00Z')),
    venue:        'SoFi Stadium, Inglewood',
  },

  // ── 29 jun ───────────────────────────────────────────────────────────────────
  {
    id:           'r32_m76',
    matchdayId:   'r32_stage',
    homeTeam:     'Brasil',       homeTeamCode: 'BRA',
    awayTeam:     'Japón',        awayTeamCode: 'JPN',
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-29T17:00:00Z')),
    venue:        'NRG Stadium, Houston',
  },
  {
    id:           'r32_m74',
    matchdayId:   'r32_stage',
    homeTeam:     'Alemania',     homeTeamCode: 'GER',
    awayTeam:     '3ro Grp C/D/F', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-29T20:30:00Z')),
    venue:        'Gillette Stadium, Foxborough',
  },
  {
    id:           'r32_m75',
    matchdayId:   'r32_stage',
    homeTeam:     'Países Bajos', homeTeamCode: 'NED',
    awayTeam:     'Marruecos',    awayTeamCode: 'MAR',
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-29T21:00:00Z')),
    venue:        'Estadio BBVA, Guadalupe',
  },

  // ── 30 jun ───────────────────────────────────────────────────────────────────
  {
    id:           'r32_m78',
    matchdayId:   'r32_stage',
    homeTeam:     'Costa de Marfil', homeTeamCode: 'CIV',
    awayTeam:     '2do Grupo I',     awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-30T17:00:00Z')),
    venue:        'AT&T Stadium, Arlington',
  },
  {
    id:           'r32_m77',
    matchdayId:   'r32_stage',
    homeTeam:     '1ro Grupo I',   homeTeamCode: TBD_CODE,
    awayTeam:     '3ro Grp D/F/G', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-30T21:00:00Z')),
    venue:        'MetLife Stadium, East Rutherford',
  },
  {
    id:           'r32_m79',
    matchdayId:   'r32_stage',
    homeTeam:     'México',         homeTeamCode: 'MEX',
    awayTeam:     '3ro Grp C/E/H', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-06-30T21:00:00Z')),
    venue:        'Estadio Azteca, Ciudad de México',
  },

  // ── 1 jul ────────────────────────────────────────────────────────────────────
  {
    id:           'r32_m80',
    matchdayId:   'r32_stage',
    homeTeam:     '1ro Grupo L',      homeTeamCode: TBD_CODE,
    awayTeam:     '3ro Grp E/I/J/K',  awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-01T16:00:00Z')),
    venue:        'Mercedes-Benz Stadium, Atlanta',
  },
  {
    id:           'r32_m81',
    matchdayId:   'r32_stage',
    homeTeam:     'Estados Unidos',    homeTeamCode: 'USA',
    awayTeam:     'Bosnia y Herzegovina', awayTeamCode: 'BIH',
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-01T20:00:00Z')),
    venue:        "Levi's Stadium, Santa Clara",
  },
  {
    id:           'r32_m82',
    matchdayId:   'r32_stage',
    homeTeam:     '1ro Grupo G',      homeTeamCode: TBD_CODE,
    awayTeam:     '3ro Grp A/H/I/J',  awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-01T20:00:00Z')),
    venue:        'Lumen Field, Seattle',
  },

  // ── 2 jul ────────────────────────────────────────────────────────────────────
  {
    id:           'r32_m84',
    matchdayId:   'r32_stage',
    homeTeam:     '1ro Grupo H', homeTeamCode: TBD_CODE,
    awayTeam:     '2do Grupo J', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-02T19:00:00Z')),
    venue:        'SoFi Stadium, Inglewood',
  },
  {
    id:           'r32_m83',
    matchdayId:   'r32_stage',
    homeTeam:     '2do Grupo K', homeTeamCode: TBD_CODE,
    awayTeam:     '2do Grupo L', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-02T23:00:00Z')),
    venue:        'BMO Field, Toronto',
  },

  // ── 3 jul ────────────────────────────────────────────────────────────────────
  {
    id:           'r32_m85',
    matchdayId:   'r32_stage',
    homeTeam:     'Suiza',               homeTeamCode: 'SUI',
    awayTeam:     '3ro Grp E/F/G/I/J',  awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-03T03:00:00Z')),
    venue:        'BC Place, Vancouver',
  },
  {
    id:           'r32_m88',
    matchdayId:   'r32_stage',
    homeTeam:     'Australia',   homeTeamCode: 'AUS',
    awayTeam:     '2do Grupo G', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-03T18:00:00Z')),
    venue:        'AT&T Stadium, Arlington',
  },
  {
    id:           'r32_m86',
    matchdayId:   'r32_stage',
    homeTeam:     'Argentina',   homeTeamCode: 'ARG',
    awayTeam:     '2do Grupo H', awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-03T22:00:00Z')),
    venue:        'Hard Rock Stadium, Miami Gardens',
  },

  // ── 4 jul ────────────────────────────────────────────────────────────────────
  {
    id:           'r32_m87',
    matchdayId:   'r32_stage',
    homeTeam:     '1ro Grupo K',         homeTeamCode: TBD_CODE,
    awayTeam:     '3ro Grp D/E/I/J/L',  awayTeamCode: TBD_CODE,
    scheduledAt:  Timestamp.fromDate(new Date('2026-07-04T01:30:00Z')),
    venue:        'Arrowhead Stadium, Kansas City',
  },
]

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seedMatchday() {
  const { id, ...data } = MATCHDAY
  await db.doc(`matchdays/${id}`).set(data)
  console.log(`  ✓ jornada "${MATCHDAY.name}" (${id})`)
}

async function seedMatches() {
  const batch = db.batch()
  for (const match of MATCHES) {
    const { id, ...data } = match
    batch.set(db.doc(`matches/${id}`), {
      ...data,
      phase:     'round_of_32',
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
  console.log('🌱 Seed R32 — 16vos de Final\n')
  await seedMatchday()
  await seedMatches()
  console.log('\n✅ Listo. Abre /admin/jornada/r32_stage para editar los equipos TBD.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en seed:r32:', err)
  process.exit(1)
})

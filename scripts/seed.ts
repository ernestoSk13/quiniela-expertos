#!/usr/bin/env tsx
/**
 * Seed script — carga equipos, jornadas y partidos de fase de grupos.
 * Requiere emuladores corriendo: npm run emulators
 * Uso: npm run seed
 *
 * Para producción: quitar FIRESTORE_EMULATOR_HOST del script en package.json
 * y proveer credenciales con: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

initializeApp({ projectId: 'quinielaexpertos26' })
const db = getFirestore()

// ─── EQUIPOS ──────────────────────────────────────────────────────────────────

const TEAMS = [
  // Grupo A (anfitrión: México)
  { id: 'MEX', name: 'México',              flag: '🇲🇽', group: 'A' },
  { id: 'RSA', name: 'Sudáfrica',           flag: '🇿🇦', group: 'A' },
  { id: 'KOR', name: 'Corea del Sur',       flag: '🇰🇷', group: 'A' },
  { id: 'CZE', name: 'República Checa',     flag: '🇨🇿', group: 'A' },
  // Grupo B (anfitrión: Canadá)
  { id: 'CAN', name: 'Canadá',              flag: '🇨🇦', group: 'B' },
  { id: 'SUI', name: 'Suiza',               flag: '🇨🇭', group: 'B' },
  { id: 'QAT', name: 'Qatar',               flag: '🇶🇦', group: 'B' },
  { id: 'BIH', name: 'Bosnia y Herzegovina',flag: '🇧🇦', group: 'B' },
  // Grupo C
  { id: 'BRA', name: 'Brasil',              flag: '🇧🇷', group: 'C' },
  { id: 'MAR', name: 'Marruecos',           flag: '🇲🇦', group: 'C' },
  { id: 'HAI', name: 'Haití',               flag: '🇭🇹', group: 'C' },
  { id: 'SCO', name: 'Escocia',             flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  // Grupo D (anfitrión: Estados Unidos)
  { id: 'USA', name: 'Estados Unidos',      flag: '🇺🇸', group: 'D' },
  { id: 'PAR', name: 'Paraguay',            flag: '🇵🇾', group: 'D' },
  { id: 'AUS', name: 'Australia',           flag: '🇦🇺', group: 'D' },
  { id: 'TUR', name: 'Türkiye',             flag: '🇹🇷', group: 'D' },
  // Grupo E
  { id: 'GER', name: 'Alemania',            flag: '🇩🇪', group: 'E' },
  { id: 'CUW', name: 'Curazao',             flag: '🇨🇼', group: 'E' },
  { id: 'CIV', name: 'Costa de Marfil',     flag: '🇨🇮', group: 'E' },
  { id: 'ECU', name: 'Ecuador',             flag: '🇪🇨', group: 'E' },
  // Grupo F
  { id: 'NED', name: 'Países Bajos',        flag: '🇳🇱', group: 'F' },
  { id: 'JPN', name: 'Japón',               flag: '🇯🇵', group: 'F' },
  { id: 'SWE', name: 'Suecia',              flag: '🇸🇪', group: 'F' },
  { id: 'TUN', name: 'Túnez',               flag: '🇹🇳', group: 'F' },
  // Grupo G
  { id: 'BEL', name: 'Bélgica',             flag: '🇧🇪', group: 'G' },
  { id: 'EGY', name: 'Egipto',              flag: '🇪🇬', group: 'G' },
  { id: 'IRN', name: 'Irán',                flag: '🇮🇷', group: 'G' },
  { id: 'NZL', name: 'Nueva Zelanda',       flag: '🇳🇿', group: 'G' },
  // Grupo H
  { id: 'ESP', name: 'España',              flag: '🇪🇸', group: 'H' },
  { id: 'CPV', name: 'Cabo Verde',          flag: '🇨🇻', group: 'H' },
  { id: 'KSA', name: 'Arabia Saudita',      flag: '🇸🇦', group: 'H' },
  { id: 'URU', name: 'Uruguay',             flag: '🇺🇾', group: 'H' },
  // Grupo I
  { id: 'FRA', name: 'Francia',             flag: '🇫🇷', group: 'I' },
  { id: 'SEN', name: 'Senegal',             flag: '🇸🇳', group: 'I' },
  { id: 'NOR', name: 'Noruega',             flag: '🇳🇴', group: 'I' },
  { id: 'IRQ', name: 'Irak',                flag: '🇮🇶', group: 'I' },
  // Grupo J
  { id: 'ARG', name: 'Argentina',           flag: '🇦🇷', group: 'J' },
  { id: 'ALG', name: 'Argelia',             flag: '🇩🇿', group: 'J' },
  { id: 'AUT', name: 'Austria',             flag: '🇦🇹', group: 'J' },
  { id: 'JOR', name: 'Jordania',            flag: '🇯🇴', group: 'J' },
  // Grupo K
  { id: 'POR', name: 'Portugal',            flag: '🇵🇹', group: 'K' },
  { id: 'COD', name: 'DR Congo',            flag: '🇨🇩', group: 'K' },
  { id: 'UZB', name: 'Uzbekistán',          flag: '🇺🇿', group: 'K' },
  { id: 'COL', name: 'Colombia',            flag: '🇨🇴', group: 'K' },
  // Grupo L
  { id: 'ENG', name: 'Inglaterra',          flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { id: 'CRO', name: 'Croacia',             flag: '🇭🇷', group: 'L' },
  { id: 'GHA', name: 'Ghana',               flag: '🇬🇭', group: 'L' },
  { id: 'PAN', name: 'Panamá',              flag: '🇵🇦', group: 'L' },
]

// ─── JORNADAS ─────────────────────────────────────────────────────────────────

const MATCHDAYS = [
  {
    id: 'group_stage_1',
    name: 'Jornada 1 — Fase de Grupos',
    phase: 'group_stage',
    order: 1,
    startDate:           Timestamp.fromDate(new Date('2026-06-11T00:00:00Z')),
    endDate:             Timestamp.fromDate(new Date('2026-06-16T23:59:59Z')),
    predictionDeadline:  Timestamp.fromDate(new Date('2026-06-11T09:00:00Z')),
    status: 'upcoming',
  },
  {
    id: 'group_stage_2',
    name: 'Jornada 2 — Fase de Grupos',
    phase: 'group_stage',
    order: 2,
    startDate:           Timestamp.fromDate(new Date('2026-06-17T00:00:00Z')),
    endDate:             Timestamp.fromDate(new Date('2026-06-22T23:59:59Z')),
    predictionDeadline:  Timestamp.fromDate(new Date('2026-06-17T09:00:00Z')),
    status: 'upcoming',
  },
  {
    id: 'group_stage_3',
    name: 'Jornada 3 — Fase de Grupos',
    phase: 'group_stage',
    order: 3,
    startDate:           Timestamp.fromDate(new Date('2026-06-25T00:00:00Z')),
    endDate:             Timestamp.fromDate(new Date('2026-07-02T23:59:59Z')),
    predictionDeadline:  Timestamp.fromDate(new Date('2026-06-25T09:00:00Z')),
    status: 'upcoming',
  },
]

// ─── GENERADOR DE PARTIDOS ────────────────────────────────────────────────────

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const MATCHDAY_IDS = ['group_stage_1', 'group_stage_2', 'group_stage_3']

/**
 * Asigna fecha UTC a cada partido.
 * 2 grupos comparten día. Grupos par → 18:00 UTC, impar → 21:00 UTC.
 * Jornada 1: Jun 11-16  |  Jornada 2: Jun 17-22  |  Jornada 3: Jun 25-30
 */
function matchDate(jornada: 1 | 2 | 3, groupIndex: number): Date {
  const bases: Record<number, Date> = {
    1: new Date('2026-06-11T00:00:00Z'),
    2: new Date('2026-06-17T00:00:00Z'),
    3: new Date('2026-06-25T00:00:00Z'),
  }
  const base = new Date(bases[jornada])
  base.setUTCDate(base.getUTCDate() + Math.floor(groupIndex / 2))
  base.setUTCHours(groupIndex % 2 === 0 ? 18 : 21)
  return base
}

function buildMatches() {
  const matches: object[] = []

  for (let gi = 0; gi < GROUPS.length; gi++) {
    const group = GROUPS[gi]
    const [t0, t1, t2, t3] = TEAMS.filter(t => t.group === group).map(t => t.id)

    const getTeamName = (code: string) => TEAMS.find(t => t.id === code)!.name

    const schedule = [
      // Jornada 1
      { jornada: 1 as const, home: t0, away: t1 },
      { jornada: 1 as const, home: t2, away: t3 },
      // Jornada 2
      { jornada: 2 as const, home: t0, away: t2 },
      { jornada: 2 as const, home: t1, away: t3 },
      // Jornada 3 (simultáneos dentro del grupo)
      { jornada: 3 as const, home: t0, away: t3 },
      { jornada: 3 as const, home: t1, away: t2 },
    ]

    for (const { jornada, home, away } of schedule) {
      matches.push({
        id: `${group}_J${jornada}_${home}_${away}`,
        matchdayId: MATCHDAY_IDS[jornada - 1],
        homeTeam: getTeamName(home),
        awayTeam: getTeamName(away),
        homeTeamCode: home,
        awayTeamCode: away,
        scheduledAt: Timestamp.fromDate(matchDate(jornada, gi)),
        status: 'upcoming',
        homeScore: null,
        awayScore: null,
        winner: null,
        phase: 'group_stage',
        group,
        venue: null,
      })
    }
  }

  return matches
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seedTeams() {
  const batch = db.batch()
  const defaults = { groupPoints: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
  for (const team of TEAMS) {
    batch.set(db.doc(`teams/${team.id}`), { ...team, ...defaults })
  }
  await batch.commit()
  console.log(`  ✓ ${TEAMS.length} equipos`)
}

async function seedMatchdays() {
  const batch = db.batch()
  for (const md of MATCHDAYS) {
    batch.set(db.doc(`matchdays/${md.id}`), md)
  }
  await batch.commit()
  console.log(`  ✓ ${MATCHDAYS.length} jornadas`)
}

async function seedMatches() {
  const matches = buildMatches()
  // Firestore batch: max 500 ops. Con 72 partidos cabe en uno.
  const batch = db.batch()
  for (const match of matches as Array<{ id: string } & object>) {
    const { id, ...data } = match
    batch.set(db.doc(`matches/${id}`), data)
  }
  await batch.commit()
  console.log(`  ✓ ${matches.length} partidos (fase de grupos)`)
}

async function main() {
  console.log('🌱 Iniciando seed en Firestore...\n')
  await seedTeams()
  await seedMatchdays()
  await seedMatches()
  console.log('\n✅ Seed completado.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})

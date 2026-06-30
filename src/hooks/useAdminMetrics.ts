import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Matchday, Match, User, Prediction } from '@/types'
import { getUserPredictions } from '@/services/firestorePredictions'

export type MetricIcon =
  | 'streak_correct'
  | 'streak_wrong'
  | 'drop'
  | 'rise'
  | 'consistent'
  | 'best'
  | 'worst'
  | 'bold'
  | 'target'
  | 'eye'
  | 'ruler'
  | 'offensive'
  | 'cautious'

export interface MetricCard {
  id: string
  title: string
  icon: MetricIcon
  winner: User | null
  value: string
  subtitle?: string
  empty: boolean
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

const MIN_EXACT_MODE_PREDS = 5

function stdDev(values: number[]): number {
  if (values.length < 2) return Infinity
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
}

function findWinner(
  users: User[],
  scoreMap: Record<string, number>,
  mode: 'highest' | 'lowest',
): { user: User; score: number } | null {
  let best: { user: User; score: number } | null = null
  for (const user of users) {
    const score = scoreMap[user.uid]
    if (score == null || !isFinite(score)) continue
    if (!best) { best = { user, score }; continue }
    if (mode === 'highest' && score > best.score) best = { user, score }
    if (mode === 'lowest' && score < best.score) best = { user, score }
  }
  return best
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [usersSnap, matchdaysSnap, matchesSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('onboardingCompleted', '==', true))),
        getDocs(query(collection(db, 'matchdays'), orderBy('order'))),
        getDocs(query(collection(db, 'matches'), where('status', '==', 'finished'))),
      ])
      if (cancelled) return

      const users = usersSnap.docs.map(d => ({ ...d.data(), uid: d.id }) as User)
      const allMatchdays = matchdaysSnap.docs.map(d => ({ ...d.data(), id: d.id }) as Matchday)
      const allMatches = matchesSnap.docs
        .map(d => ({ ...d.data(), id: d.id }) as Match)
        .sort((a, b) => a.scheduledAt.toMillis() - b.scheduledAt.toMillis())

      if (users.length < 2 || allMatches.length === 0) {
        if (!cancelled) { setMetrics([]); setLoading(false) }
        return
      }

      const predArrays = await Promise.all(users.map(u => getUserPredictions(u.uid)))
      if (cancelled) return

      // ── Lookup structures ────────────────────────────────────────────────────
      const matchById = Object.fromEntries(allMatches.map(m => [m.id, m]))
      const matchdayById = Object.fromEntries(allMatchdays.map(md => [md.id, md]))
      const finishedMdIds = new Set(allMatches.map(m => m.matchdayId))
      const matchdays = allMatchdays.filter(md => finishedMdIds.has(md.id))

      // Scored predictions per user, chronologically sorted
      const scoredByUser: Record<string, Prediction[]> = {}
      for (let i = 0; i < users.length; i++) {
        scoredByUser[users[i].uid] = predArrays[i]
          .filter(p => p.points != null && matchById[p.matchId])
          .sort((a, b) => {
            const oA = matchdayById[matchById[a.matchId].matchdayId]?.order ?? 0
            const oB = matchdayById[matchById[b.matchId].matchdayId]?.order ?? 0
            if (oA !== oB) return oA - oB
            return matchById[a.matchId].scheduledAt.toMillis() - matchById[b.matchId].scheduledAt.toMillis()
          })
      }

      // Points per user per matchday
      const ptsByMd: Record<string, Record<string, number>> = {}
      const mdWithPredsByUser: Record<string, Set<string>> = {}
      for (const user of users) {
        ptsByMd[user.uid] = {}
        mdWithPredsByUser[user.uid] = new Set()
        for (const p of scoredByUser[user.uid]) {
          const mdId = matchById[p.matchId]?.matchdayId
          if (!mdId) continue
          ptsByMd[user.uid][mdId] = (ptsByMd[user.uid][mdId] ?? 0) + (p.points ?? 0)
          mdWithPredsByUser[user.uid].add(mdId)
        }
      }

      // ── 1 & 2: Streaks ───────────────────────────────────────────────────────
      const longestCorrect: Record<string, number> = {}
      const longestWrong: Record<string, number> = {}

      for (const user of users) {
        let maxC = 0, maxW = 0, curC = 0, curW = 0
        for (const p of scoredByUser[user.uid]) {
          if (p.isCorrect) { curC++; curW = 0; maxC = Math.max(maxC, curC) }
          else             { curW++; curC = 0; maxW = Math.max(maxW, curW) }
        }
        longestCorrect[user.uid] = maxC
        longestWrong[user.uid] = maxW
      }

      // ── 3 & 4: Position history ──────────────────────────────────────────────
      const cumPts: Record<string, number> = Object.fromEntries(users.map(u => [u.uid, 0]))
      const bestPos: Record<string, number> = Object.fromEntries(users.map(u => [u.uid, Infinity]))
      const worstPos: Record<string, number> = Object.fromEntries(users.map(u => [u.uid, 0]))

      for (const md of matchdays) {
        const anyScored = users.some(u => mdWithPredsByUser[u.uid].has(md.id))
        if (!anyScored) continue
        for (const u of users) cumPts[u.uid] += ptsByMd[u.uid][md.id] ?? 0
        const ranked = [...users].sort((a, b) => cumPts[b.uid] - cumPts[a.uid])
        ranked.forEach((u, i) => {
          const pos = i + 1
          bestPos[u.uid] = Math.min(bestPos[u.uid], pos)
          worstPos[u.uid] = Math.max(worstPos[u.uid], pos)
        })
      }

      const currentRanked = [...users].sort((a, b) => cumPts[b.uid] - cumPts[a.uid])
      const currentPos: Record<string, number> = {}
      currentRanked.forEach((u, i) => { currentPos[u.uid] = i + 1 })

      const posDropMap: Record<string, number> = {}
      const posRiseMap: Record<string, number> = {}
      for (const u of users) {
        const best  = bestPos[u.uid]  === Infinity ? currentPos[u.uid] : bestPos[u.uid]
        const worst = worstPos[u.uid] === 0        ? currentPos[u.uid] : worstPos[u.uid]
        posDropMap[u.uid] = currentPos[u.uid] - best   // positive = fell
        posRiseMap[u.uid] = worst - currentPos[u.uid]  // positive = rose
      }

      // ── 5: Consistency (lowest std dev) ──────────────────────────────────────
      const consistencyMap: Record<string, number> = {}
      for (const u of users) {
        const vals = Object.values(ptsByMd[u.uid])
        if (vals.length >= 2) consistencyMap[u.uid] = stdDev(vals)
      }

      // ── 6: Best single matchday ───────────────────────────────────────────────
      let bestMdUser: User | null = null, bestMdPts = 0, bestMdName = ''
      for (const u of users) {
        for (const [mdId, pts] of Object.entries(ptsByMd[u.uid])) {
          if (pts > bestMdPts) {
            bestMdPts = pts
            bestMdUser = u
            bestMdName = matchdayById[mdId]?.name ?? ''
          }
        }
      }

      // ── 7: Worst matchday (scored 0 while all others scored ≥1) ──────────────
      const badMdCount: Record<string, number> = Object.fromEntries(users.map(u => [u.uid, 0]))
      for (const md of matchdays) {
        const participating = users.filter(u => mdWithPredsByUser[u.uid].has(md.id))
        if (participating.length < 2) continue
        for (const u of participating) {
          if ((ptsByMd[u.uid][md.id] ?? 0) === 0) {
            const allOthersScored = participating
              .filter(other => other.uid !== u.uid)
              .every(other => (ptsByMd[other.uid][md.id] ?? 0) > 0)
            if (allOthersScored) badMdCount[u.uid]++
          }
        }
      }

      // ── 8: Most risky (% draws in group stage) ────────────────────────────────
      const groupMdIds = new Set(allMatchdays.filter(md => md.phase === 'group_stage').map(md => md.id))
      const drawPctMap: Record<string, number> = {}
      const drawCountMap: Record<string, number> = {}
      for (let i = 0; i < users.length; i++) {
        const u = users[i]
        const gPreds = predArrays[i].filter(p => groupMdIds.has(p.matchdayId) && p.result != null)
        if (gPreds.length === 0) continue
        const draws = gPreds.filter(p => p.result === 'draw').length
        drawPctMap[u.uid] = draws / gPreds.length
        drawCountMap[u.uid] = draws
      }

      // ── 9-13: Exact-score metrics (predictionMode === 'exact_score' only) ────
      const exactModeScoredByUser: Record<string, Prediction[]> = {}
      for (const u of users) {
        exactModeScoredByUser[u.uid] = scoredByUser[u.uid].filter(p => {
          const md = matchdayById[matchById[p.matchId].matchdayId]
          return md?.predictionMode === 'exact_score' && p.homeGoals != null && p.awayGoals != null
        })
      }

      // 9: Francotirador — más marcadores exactos totales (ya acumulado server-side)
      const exactScoreCountMap: Record<string, number> = {}
      for (const u of users) exactScoreCountMap[u.uid] = u.stats.exactScoreCount ?? 0

      // 10: Ojo de águila — mejor proporción de exactos, mínimo de predicciones para calificar
      const exactRatioMap: Record<string, number> = {}
      for (const u of users) {
        const preds = exactModeScoredByUser[u.uid]
        if (preds.length < MIN_EXACT_MODE_PREDS) continue
        const exactCount = preds.filter(p => {
          const m = matchById[p.matchId]
          return p.homeGoals === m.homeScore && p.awayGoals === m.awayScore
        }).length
        exactRatioMap[u.uid] = exactCount / preds.length
      }

      // 11: Mayor error de marcador — la predicción individual más alejada del resultado real
      let worstErrUser: User | null = null
      let worstErrValue = -1
      let worstErrPred: Prediction | null = null
      let worstErrMatch: Match | null = null
      for (const u of users) {
        for (const p of exactModeScoredByUser[u.uid]) {
          const m = matchById[p.matchId]
          if (m.homeScore == null || m.awayScore == null) continue
          const err = Math.abs((p.homeGoals as number) - m.homeScore) + Math.abs((p.awayGoals as number) - m.awayScore)
          if (err > worstErrValue) {
            worstErrValue = err
            worstErrUser = u
            worstErrPred = p
            worstErrMatch = m
          }
        }
      }

      // 12 & 13: Más ofensivo / Más cauteloso — promedio de goles totales pronosticados
      const avgGoalsMap: Record<string, number> = {}
      for (const u of users) {
        const preds = exactModeScoredByUser[u.uid]
        if (preds.length === 0) continue
        const totalGoals = preds.reduce((s, p) => s + (p.homeGoals as number) + (p.awayGoals as number), 0)
        avgGoalsMap[u.uid] = totalGoals / preds.length
      }

      // ── Build cards ───────────────────────────────────────────────────────────
      const w1 = findWinner(users, longestCorrect, 'highest')
      const w2 = findWinner(users, longestWrong, 'highest')
      const w3 = findWinner(users, posDropMap, 'highest')
      const w4 = findWinner(users, posRiseMap, 'highest')
      const w5 = findWinner(users, consistencyMap, 'lowest')
      const w7 = findWinner(users, badMdCount, 'highest')
      const w8 = findWinner(users, drawPctMap, 'highest')
      const w9 = findWinner(users, exactScoreCountMap, 'highest')
      const w10 = findWinner(users, exactRatioMap, 'highest')
      const w12 = findWinner(users, avgGoalsMap, 'highest')
      const w13 = findWinner(users, avgGoalsMap, 'lowest')

      const cards: MetricCard[] = [
        {
          id: 'streak_correct',
          title: 'Racha de aciertos',
          icon: 'streak_correct',
          winner: w1 && w1.score > 0 ? w1.user : null,
          value: w1 && w1.score > 0 ? String(w1.score) : '—',
          subtitle: w1 && w1.score > 0 ? 'seguidas' : undefined,
          empty: !w1 || w1.score === 0,
        },
        {
          id: 'streak_wrong',
          title: 'Racha de errores',
          icon: 'streak_wrong',
          winner: w2 && w2.score > 0 ? w2.user : null,
          value: w2 && w2.score > 0 ? String(w2.score) : '—',
          subtitle: w2 && w2.score > 0 ? 'seguidos' : undefined,
          empty: !w2 || w2.score === 0,
        },
        {
          id: 'drop',
          title: 'Mayor caída',
          icon: 'drop',
          winner: w3 && w3.score > 0 ? w3.user : null,
          value: w3 && w3.score > 0 ? String(w3.score) : '—',
          subtitle: w3 && w3.score > 0 ? 'puestos' : undefined,
          empty: !w3 || w3.score <= 0,
        },
        {
          id: 'rise',
          title: 'Mayor remontada',
          icon: 'rise',
          winner: w4 && w4.score > 0 ? w4.user : null,
          value: w4 && w4.score > 0 ? String(w4.score) : '—',
          subtitle: w4 && w4.score > 0 ? 'puestos' : undefined,
          empty: !w4 || w4.score <= 0,
        },
        {
          id: 'consistent',
          title: 'Más consistente',
          icon: 'consistent',
          winner: w5 ? w5.user : null,
          value: w5 ? w5.score.toFixed(1) : '—',
          subtitle: w5 ? 'σ pts/jornada' : undefined,
          empty: !w5,
        },
        {
          id: 'best',
          title: 'Mejor jornada',
          icon: 'best',
          winner: bestMdUser,
          value: bestMdPts > 0 ? String(bestMdPts) : '—',
          subtitle: bestMdName || undefined,
          empty: !bestMdUser,
        },
        {
          id: 'worst',
          title: 'Cero cuando otros no',
          icon: 'worst',
          winner: w7 && w7.score > 0 ? w7.user : null,
          value: w7 && w7.score > 0 ? String(w7.score) : '—',
          subtitle: w7 && w7.score > 0 ? 'jornadas sin puntuar' : undefined,
          empty: !w7 || w7.score === 0,
        },
        {
          id: 'bold',
          title: 'Más arriesgado',
          icon: 'bold',
          winner: w8 ? w8.user : null,
          value: w8 ? `${Math.round(w8.score * 100)}%` : '—',
          subtitle: w8 ? `${drawCountMap[w8.user.uid]} empates en grupos` : undefined,
          empty: !w8,
        },
        {
          id: 'target',
          title: 'Francotirador',
          icon: 'target',
          winner: w9 && w9.score > 0 ? w9.user : null,
          value: w9 && w9.score > 0 ? String(w9.score) : '—',
          subtitle: w9 && w9.score > 0 ? 'marcadores exactos' : undefined,
          empty: !w9 || w9.score === 0,
        },
        {
          id: 'eye',
          title: 'Ojo de águila',
          icon: 'eye',
          winner: w10 ? w10.user : null,
          value: w10 ? `${Math.round(w10.score * 100)}%` : '—',
          subtitle: w10 ? 'de marcadores exactos' : undefined,
          empty: !w10,
        },
        {
          id: 'ruler',
          title: 'Mayor error de marcador',
          icon: 'ruler',
          winner: worstErrValue > 0 ? worstErrUser : null,
          value: worstErrValue > 0 ? String(worstErrValue) : '—',
          subtitle: worstErrValue > 0 && worstErrPred && worstErrMatch
            ? `Predijo ${worstErrPred.homeGoals}–${worstErrPred.awayGoals}, fue ${worstErrMatch.homeScore}–${worstErrMatch.awayScore}`
            : undefined,
          empty: worstErrValue <= 0,
        },
        {
          id: 'offensive',
          title: 'Más ofensivo',
          icon: 'offensive',
          winner: w12 ? w12.user : null,
          value: w12 ? w12.score.toFixed(1) : '—',
          subtitle: w12 ? 'goles promedio/partido' : undefined,
          empty: !w12,
        },
        {
          id: 'cautious',
          title: 'Más cauteloso',
          icon: 'cautious',
          winner: w13 ? w13.user : null,
          value: w13 ? w13.score.toFixed(1) : '—',
          subtitle: w13 ? 'goles promedio/partido' : undefined,
          empty: !w13,
        },
      ]

      if (!cancelled) { setMetrics(cards); setLoading(false) }
    }

    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { metrics, loading }
}

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User, Matchday, Match, Prediction } from '@/types'
import Avatar from '@/components/Avatar'
import { useAdminMetrics, type MetricCard, type MetricIcon } from '@/hooks/useAdminMetrics'

// ── Aggregated types ───────────────────────────────────────────────────────────

interface MatchdayRow {
  matchday: Matchday
  totalMatches: number
  finishedMatches: number
  participants: number
  totalPredictions: number
  totalPoints: number
  exactCount: number
  correctCount: number
}

interface MatchRow {
  match: Match
  totalPredictions: number
  exactCount: number
}

interface Metrics {
  activePlayers: number
  totalPredictions: number
  avgPoints: number
  correctRate: number
  matchdayRows: MatchdayRow[]
  hardestMatches: MatchRow[]
}

// ── Data loading ───────────────────────────────────────────────────────────────

async function loadMetrics(): Promise<Metrics> {
  const [usersSnap, matchdaysSnap, matchesSnap, predsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'matchdays'), orderBy('order'))),
    getDocs(collection(db, 'matches')),
    getDocs(collection(db, 'predictions')),
  ])

  const players = usersSnap.docs
    .map(d => ({ uid: d.id, ...d.data() } as User))
    .filter(u => u.role === 'player')
  const activePlayers = players.filter(u => u.onboardingCompleted)
  const matchdays = matchdaysSnap.docs.map(d => ({ id: d.id, ...d.data() } as Matchday))
  const matches   = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Match))
  const preds     = predsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prediction))

  // Global
  const totalPredictions = preds.length
  const sumPoints  = activePlayers.reduce((s, u) => s + u.stats.totalPoints, 0)
  const avgPoints  = activePlayers.length > 0 ? sumPoints / activePlayers.length : 0
  const sumCorrect = activePlayers.reduce((s, u) => s + u.stats.correctPredictions, 0)
  const sumPreds   = activePlayers.reduce((s, u) => s + u.stats.totalPredictions, 0)
  const correctRate = sumPreds > 0 ? sumCorrect / sumPreds : 0

  // Group predictions by matchday and by match
  const predsByMatchday = new Map<string, Prediction[]>()
  const predsByMatch    = new Map<string, Prediction[]>()
  for (const p of preds) {
    if (!predsByMatchday.has(p.matchdayId)) predsByMatchday.set(p.matchdayId, [])
    predsByMatchday.get(p.matchdayId)!.push(p)
    if (!predsByMatch.has(p.matchId)) predsByMatch.set(p.matchId, [])
    predsByMatch.get(p.matchId)!.push(p)
  }

  // Per-matchday rows (only those with at least one prediction)
  const matchdayRows: MatchdayRow[] = matchdays
    .map(md => {
      const mdMatches     = matches.filter(m => m.matchdayId === md.id)
      const finishedCount = mdMatches.filter(m => m.homeScore !== null).length
      const mdPreds       = predsByMatchday.get(md.id) ?? []
      const participants  = new Set(mdPreds.map(p => p.userId)).size
      const totalPoints   = mdPreds.reduce((s, p) => s + (p.points ?? 0), 0)
      const correctCount  = mdPreds.filter(p => p.isCorrect).length
      return {
        matchday: md,
        totalMatches: mdMatches.length,
        finishedMatches: finishedCount,
        participants,
        totalPredictions: mdPreds.length,
        totalPoints,
        exactCount: 0,
        correctCount,
      }
    })
    .filter(r => r.totalPredictions > 0)

  // Per-match rows: only finished matches with predictions, sorted hardest first
  const hardestMatches: MatchRow[] = matches
    .filter(m => m.homeScore !== null)
    .map(m => {
      const mPreds    = predsByMatch.get(m.id) ?? []
      const exactCount = mPreds.filter(p => p.isCorrect).length
      return { match: m, totalPredictions: mPreds.length, exactCount }
    })
    .filter(r => r.totalPredictions > 0)
    .sort((a, b) => (a.exactCount / a.totalPredictions) - (b.exactCount / b.totalPredictions))
    .slice(0, 8)

  return {
    activePlayers: activePlayers.length,
    totalPredictions,
    avgPoints: Math.round(avgPoints * 10) / 10,
    correctRate,
    matchdayRows,
    hardestMatches,
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { metrics: playerMetrics, loading: playerMetricsLoading } = useAdminMetrics()

  async function load(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      setMetrics(await loadMetrics())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <MetricsSkeleton />

  if (!metrics) return null

  const noData = metrics.matchdayRows.length === 0

  return (
    <>
      <style>{styles}</style>

      {/* ── Header ── */}
      <div className="met-header">
        <div>
          <div className="met-title">MÉTRICAS</div>
          <div className="met-subtitle">Vista general · datos en tiempo de carga</div>
        </div>
        <button
          className="met-refresh-btn"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshIcon spinning={refreshing} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="met-grid-4">
        <StatCard
          icon="👥"
          value={metrics.activePlayers}
          label="Jugadores activos"
        />
        <StatCard
          icon="📋"
          value={metrics.totalPredictions}
          label="Pronósticos enviados"
        />
        <StatCard
          icon="⭐"
          value={metrics.avgPoints.toFixed(1)}
          label="Promedio de puntos"
          accent
        />
        <StatCard
          icon="🎯"
          value={`${(metrics.correctRate * 100).toFixed(1)}%`}
          label="Tasa de aciertos"
        />
      </div>

      {noData ? (
        <div className="met-empty">
          <span style={{ fontSize: 32 }}>📊</span>
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Aún no hay pronósticos puntuados
          </div>
        </div>
      ) : (
        <>
          {/* ── Participación por jornada ── */}
          <SectionHeader title="PARTICIPACIÓN POR JORNADA" />
          <div className="met-section-body">
            {metrics.matchdayRows.map(row => (
              <MatchdayMetricsRow
                key={row.matchday.id}
                row={row}
                totalPlayers={metrics.activePlayers}
              />
            ))}
          </div>

          {/* ── Partidos más difíciles ── */}
          {metrics.hardestMatches.length > 0 && (
            <>
              <SectionHeader title="PARTIDOS MÁS DIFÍCILES" subtitle="menor tasa de aciertos" />
              <div className="met-section-body">
                {metrics.hardestMatches.map((row, i) => (
                  <HardMatchRow key={row.match.id} row={row} rank={i + 1} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Player records ── */}
      <SectionHeader title="RÉCORDS DE JUGADORES" subtitle="basado en pronósticos puntuados" />
      {playerMetricsLoading ? (
        <div className="met-grid-records">
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} className="met-shimmer" style={{ height: 128, borderRadius: 12 }} />
          ))}
        </div>
      ) : playerMetrics.length === 0 ? (
        <div className="met-empty">
          <span style={{ fontSize: 28 }}>📈</span>
          <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
            Se necesitan al menos 2 jugadores con pronósticos puntuados
          </div>
        </div>
      ) : (
        <div className="met-grid-records">
          {playerMetrics.map(card => (
            <PlayerRecordCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon, value, label, accent = false,
}: { icon: string; value: string | number; label: string; accent?: boolean }) {
  return (
    <div className={`met-stat-card ${accent ? 'met-stat-accent' : ''}`}>
      <div className="met-stat-icon">{icon}</div>
      <div className={`met-stat-value ${accent ? 'met-stat-value-accent' : ''}`}>
        {value}
      </div>
      <div className="met-stat-label">{label}</div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="met-section-header">
      <span className="met-section-title">{title}</span>
      {subtitle && <span className="met-section-sub">{subtitle}</span>}
      <div className="met-section-line" />
    </div>
  )
}

function MatchdayMetricsRow({
  row, totalPlayers,
}: { row: MatchdayRow; totalPlayers: number }) {
  const participationRate = totalPlayers > 0 ? row.participants / totalPlayers : 0
  const avgPts = row.participants > 0
    ? (row.totalPoints / row.participants).toFixed(1)
    : '—'
  const correctRate = row.totalPredictions > 0
    ? ((row.correctCount / row.totalPredictions) * 100).toFixed(1)
    : '—'

  return (
    <div className="met-jornada-row">
      {/* Top row: name + participation */}
      <div className="met-jornada-top">
        <span className="met-jornada-name">{row.matchday.name}</span>
        <span className="met-jornada-count">
          {row.participants}/{totalPlayers} jugadores
        </span>
        <span className="met-jornada-pct">
          {(participationRate * 100).toFixed(0)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="met-bar-track">
        <div
          className="met-bar-fill"
          style={{ width: `${participationRate * 100}%` }}
        />
      </div>

      {/* Bottom stats */}
      <div className="met-jornada-stats">
        <Pill label="Pts promedio" value={avgPts} />
        <Pill label="Aciertos" value={`${row.correctCount} (${correctRate}%)`} green />
        <Pill label="Partidos" value={`${row.finishedMatches}/${row.totalMatches}`} />
      </div>
    </div>
  )
}

function HardMatchRow({ row, rank }: { row: MatchRow; rank: number }) {
  const { match, totalPredictions, exactCount } = row
  const correctRate = totalPredictions > 0 ? exactCount / totalPredictions : 0
  const score = match.homeScore !== null
    ? `${match.homeScore}–${match.awayScore}`
    : '?–?'

  const diffColor = correctRate < 0.1
    ? 'rgba(239,68,68,0.8)'
    : correctRate < 0.25
      ? 'rgba(250,204,21,0.75)'
      : 'rgba(74,222,128,0.7)'

  return (
    <div className="met-match-row">
      <div className="met-match-rank">#{rank}</div>

      <div className="met-match-fixture">
        <span className="met-match-codes">
          {match.homeTeamCode} <span className="met-match-vs">vs</span> {match.awayTeamCode}
        </span>
        <span className="met-match-score">{score}</span>
      </div>

      <div className="met-match-right">
        <span className="met-match-exact-count" style={{ color: diffColor }}>
          {exactCount}/{totalPredictions} aciertos
        </span>
        <div className="met-bar-track met-bar-track-sm">
          <div
            className="met-bar-fill-difficulty"
            style={{ width: `${correctRate * 100}%`, background: diffColor }}
          />
        </div>
      </div>
    </div>
  )
}

function Pill({
  label, value, green = false,
}: { label: string; value: string | number; green?: boolean }) {
  return (
    <div className="met-pill">
      <span className="met-pill-label">{label}</span>
      <span className={`met-pill-value ${green ? 'met-pill-green' : ''}`}>{value}</span>
    </div>
  )
}

// ── Player record card ─────────────────────────────────────────────────────────

const ICON_PATHS: Record<MetricIcon, JSX.Element> = {
  streak_correct: (
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  streak_wrong: (
    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm4 6-8 8M8 8l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  drop: (
    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  rise: (
    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  consistent: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
  best: (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  worst: (
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  bold: (
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
}

function PlayerRecordCard({ card }: { card: MetricCard }) {
  return (
    <div className="met-record-card">
      <div className="met-record-icon-bg">
        <svg width="28" height="28" viewBox="0 0 24 24">
          {ICON_PATHS[card.icon]}
        </svg>
      </div>
      <div className="met-record-title">{card.title}</div>

      {card.winner ? (
        <div className="met-record-player">
          <Avatar
            url={card.winner.avatarUrl ?? ''}
            name={card.winner.displayName}
            size="sm"
          />
          <span className="met-record-player-name">{card.winner.displayName}</span>
        </div>
      ) : (
        <div className="met-record-player">
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>Sin datos</span>
        </div>
      )}

      <div className="met-record-value">{card.value}</div>
      {card.subtitle && <div className="met-record-sub">{card.subtitle}</div>}
    </div>
  )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={spinning ? { animation: 'met-spin 0.8s linear infinite' } : {}}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function MetricsSkeleton() {
  return (
    <>
      <style>{styles}</style>
      <div className="met-header">
        <div>
          <div className="met-title">MÉTRICAS</div>
          <div className="met-subtitle">Cargando datos…</div>
        </div>
      </div>
      <div className="met-grid-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="met-stat-card met-shimmer" style={{ height: 88 }} />
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} className="met-shimmer" style={{ height: 72, borderRadius: 10 }} />
        ))}
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes met-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes met-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .met-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 24px;
  }
  .met-title {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1.7rem;
    letter-spacing: 0.08em;
    color: #ffffff;
    line-height: 1;
  }
  .met-subtitle {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.28);
    margin-top: 4px;
    letter-spacing: 0.04em;
  }

  .met-refresh-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.4);
    background: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .met-refresh-btn:hover:not(:disabled) {
    color: var(--accent-light);
    border-color: var(--accent-muted);
    background: var(--accent-deep);
  }
  .met-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Stat cards ── */
  .met-grid-4 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    margin-bottom: 28px;
  }
  .met-stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 14px 16px 12px;
    border-left: 3px solid rgba(255,255,255,0.08);
    transition: border-color 0.15s ease;
  }
  .met-stat-accent {
    border-left-color: var(--accent);
    background: var(--accent-deep);
  }
  .met-stat-icon {
    font-size: 1.1rem;
    line-height: 1;
    margin-bottom: 8px;
  }
  .met-stat-value {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 2rem;
    letter-spacing: 0.04em;
    color: #ffffff;
    line-height: 1;
    margin-bottom: 4px;
  }
  .met-stat-value-accent { color: var(--accent-light); }
  .met-stat-label {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
  }

  /* ── Section header ── */
  .met-section-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
    margin-top: 28px;
  }
  .met-section-title {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.7);
    white-space: nowrap;
  }
  .met-section-sub {
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .met-section-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }
  .met-section-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ── Jornada row ── */
  .met-jornada-row {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .met-jornada-top {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
  }
  .met-jornada-name {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.85);
    flex: 1;
    min-width: 0;
  }
  .met-jornada-count {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
  }
  .met-jornada-pct {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1.05rem;
    letter-spacing: 0.04em;
    color: var(--accent-light);
    white-space: nowrap;
    min-width: 36px;
    text-align: right;
  }

  /* ── Progress bar ── */
  .met-bar-track {
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .met-bar-track-sm {
    height: 3px;
    margin-bottom: 0;
    flex: 1;
  }
  .met-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 99px;
    transition: width 0.4s ease;
  }
  .met-bar-fill-difficulty {
    height: 100%;
    border-radius: 99px;
    transition: width 0.4s ease;
  }

  /* ── Pills ── */
  .met-jornada-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .met-pill {
    display: flex;
    gap: 4px;
    align-items: center;
    background: rgba(255,255,255,0.04);
    border-radius: 6px;
    padding: 3px 7px;
    font-size: 0.67rem;
  }
  .met-pill-label {
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .met-pill-value {
    color: rgba(255,255,255,0.7);
    font-weight: 600;
  }
  .met-pill-green { color: rgba(74,222,128,0.9); }

  /* ── Match row ── */
  .met-match-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 10px 14px;
  }
  .met-match-rank {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.06em;
    min-width: 20px;
    flex-shrink: 0;
  }
  .met-match-fixture {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .met-match-codes {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.8);
    white-space: nowrap;
  }
  .met-match-vs {
    font-size: 0.6rem;
    color: rgba(255,255,255,0.2);
    font-family: system-ui, sans-serif;
  }
  .met-match-score {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .met-match-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    min-width: 160px;
  }
  .met-match-exact-count {
    font-size: 0.68rem;
    white-space: nowrap;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  /* ── Empty state ── */
  .met-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    text-align: center;
  }

  /* ── Skeleton ── */
  .met-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.04) 100%
    );
    background-size: 800px 100%;
    animation: met-shimmer 1.4s infinite linear;
    border-radius: 12px;
  }

  /* ── Player records grid ── */
  .met-grid-records {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(152px, 1fr));
    gap: 10px;
    margin-bottom: 28px;
  }
  .met-record-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 14px 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    overflow: hidden;
  }
  .met-record-icon-bg {
    color: var(--accent-light);
    opacity: 0.18;
    position: absolute;
    top: 10px;
    right: 12px;
    pointer-events: none;
  }
  .met-record-title {
    font-size: 0.67rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    padding-right: 36px;
    line-height: 1.3;
  }
  .met-record-player {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    margin-top: 2px;
  }
  .met-record-player-name {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.8);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .met-record-value {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 2.2rem;
    letter-spacing: 0.04em;
    color: var(--accent-light);
    line-height: 1;
    margin-top: 4px;
  }
  .met-record-sub {
    font-size: 0.67rem;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.04em;
    margin-top: -2px;
  }
`

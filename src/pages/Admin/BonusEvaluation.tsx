import { useState } from 'react'
import { useTeamsMap } from '@/hooks/useTeams'
import { evaluateBonusPredictions } from '@/services/cloudFunctions'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

const MEXICO_PHASES = [
  { value: 'grupos',   label: 'Fase de grupos' },
  { value: 'ronda32',  label: 'Ronda de 32' },
  { value: 'octavos',  label: 'Octavos de final' },
  { value: 'cuartos',  label: 'Cuartos de final' },
  { value: 'semis',    label: 'Semifinales' },
  { value: 'tercero',  label: 'Tercer lugar' },
  { value: 'campeon',  label: 'Campeón' },
]

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>{hint}</p>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function BonusEvaluation() {
  const { teamsMap, loading: teamsLoading } = useTeamsMap()

  const [topScorer, setTopScorer] = useState('')
  const [goldenBall, setGoldenBall] = useState('')
  const [mexicoPhase, setMexicoPhase] = useState('')
  const [champion, setChampion] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teams = Object.values(teamsMap).sort((a, b) => {
    const ga = a.group ?? ''
    const gb = b.group ?? ''
    return ga.localeCompare(gb) || a.name.localeCompare(b.name)
  })

  const grouped = teams.reduce<Record<string, typeof teams>>((acc, t) => {
    const g = t.group ?? 'Sin grupo'
    ;(acc[g] ??= []).push(t)
    return acc
  }, {})
  const groups = Object.keys(grouped).sort()

  const isValid = topScorer.trim() && goldenBall.trim() && mexicoPhase && champion

  async function handleSubmit() {
    if (!isValid) return
    const confirmed = window.confirm(
      '¿Confirmas los resultados finales?\n\n' +
      `Goleador: ${topScorer}\n` +
      `Balón de Oro: ${goldenBall}\n` +
      `Fase México: ${MEXICO_PHASES.find(p => p.value === mexicoPhase)?.label}\n` +
      `Campeón: ${teamsMap[champion]?.name ?? champion}\n\n` +
      'Se otorgarán puntos a todos los jugadores. Esta acción no se puede deshacer.',
    )
    if (!confirmed) return

    setSaving(true)
    setError(null)
    try {
      await evaluateBonusPredictions({ topScorer, goldenBall, mexicoPhase, champion })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  // ── Done state ──

  if (done) {
    return (
      <>
        <style>{styles}</style>
        <div style={{ maxWidth: 480 }}>
          <div className="be-done-card rounded-2xl p-8 text-center">
            <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🏆</div>
            <div style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', lineHeight: 1, marginBottom: 8 }}>
              ¡PUNTOS BONUS OTORGADOS!
            </div>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Los pronósticos bonus de todos los jugadores han sido evaluados.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
          BONUS FINAL
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Ingresa los resultados finales del torneo. Cada acierto vale 5 puntos.
        </p>
      </div>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Form card */}
        <div className="be-card rounded-2xl overflow-hidden">
          {/* Card header stripe */}
          <div style={{ height: 3, background: 'linear-gradient(to right, var(--accent-light), var(--accent), transparent)' }} />

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            <Field label="Goleador del torneo" hint="Nombre completo del jugador">
              <input
                type="text"
                value={topScorer}
                onChange={e => setTopScorer(e.target.value)}
                placeholder="Ej. Kylian Mbappé"
                maxLength={60}
                className="be-input w-full"
              />
            </Field>

            <Field label="Balón de Oro" hint="Mejor jugador del torneo">
              <input
                type="text"
                value={goldenBall}
                onChange={e => setGoldenBall(e.target.value)}
                placeholder="Ej. Lionel Messi"
                maxLength={60}
                className="be-input w-full"
              />
            </Field>

            <Field label="¿Hasta qué fase llegó México?">
              <select
                value={mexicoPhase}
                onChange={e => setMexicoPhase(e.target.value)}
                className="be-select w-full"
              >
                <option value="" disabled>Selecciona una fase</option>
                {MEXICO_PHASES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Campeón del Mundial">
              {teamsLoading ? (
                <div className="be-shimmer" style={{ height: 42, borderRadius: 10 }} />
              ) : (
                <select
                  value={champion}
                  onChange={e => setChampion(e.target.value)}
                  className="be-select w-full"
                >
                  <option value="" disabled>Selecciona un equipo</option>
                  {groups.map(g => (
                    <optgroup key={g} label={`Grupo ${g}`}>
                      {grouped[g].map(t => (
                        <option key={t.id} value={t.id}>
                          {t.flag} {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(239,68,68,0.8)', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="be-btn-primary w-full py-3.5 rounded-xl text-sm"
        >
          {saving ? 'Evaluando...' : 'Otorgar puntos bonus'}
        </button>
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes be-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .be-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 800px 100%;
    animation: be-shimmer 1.6s ease-in-out infinite;
  }

  .be-card {
    background: var(--surface-card);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .be-done-card {
    background: var(--surface-card);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .be-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 14px;
    color: white;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }
  .be-input::placeholder { color: rgba(255,255,255,0.2); }
  .be-input:focus { border-color: var(--accent); }

  .be-select {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 14px;
    color: white;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }
  .be-select:focus { border-color: var(--accent); }

  .be-btn-primary {
    background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%);
    border: none;
    color: white;
    font-weight: 700;
    cursor: pointer;
    font-family: ${BEBAS};
    letter-spacing: 0.1em;
    font-size: 1rem !important;
    transition: opacity 0.15s ease, transform 0.1s ease;
    box-shadow: 0 4px 20px var(--accent-muted);
  }
  .be-btn-primary:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
  }
  .be-btn-primary:active:not(:disabled) {
    transform: scale(0.98);
  }
  .be-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
`

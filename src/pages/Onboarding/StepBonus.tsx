import type { Team } from '@/types'
import type { BonusPredictions } from '@/types/User'

const MEXICO_PHASES = [
  { value: 'grupos',   label: 'Fase de grupos' },
  { value: 'ronda32', label: 'Ronda de 32' },
  { value: 'octavos', label: 'Octavos de final' },
  { value: 'cuartos', label: 'Cuartos de final' },
  { value: 'semis',   label: 'Semifinales' },
  { value: 'tercero', label: 'Tercer lugar' },
  { value: 'campeon', label: 'Campeón' },
]

interface Props {
  bonus: BonusPredictions
  teams: Team[]
  onBonusChange: (b: BonusPredictions) => void
  onBack: () => void
  onSubmit: () => void
  loading: boolean
}

export default function StepBonus({ bonus, teams, onBonusChange, onBack, onSubmit, loading }: Props) {
  function set(key: keyof BonusPredictions, value: string) {
    onBonusChange({ ...bonus, [key]: value })
  }

  const grouped = teams.reduce<Record<string, Team[]>>((acc, t) => {
    const g = t.group ?? 'Sin grupo'
    ;(acc[g] ??= []).push(t)
    return acc
  }, {})
  const groups = Object.keys(grouped).sort()

  const isValid =
    bonus.topScorer.trim() &&
    bonus.goldenBall.trim() &&
    bonus.mexicoPhase &&
    bonus.champion

  const championTeam = teams.find(t => t.id === bonus.champion)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        .sb-arcade-input {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          font-size: 1.3rem;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          background: rgba(38, 50, 38, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          border-radius: 0.625rem;
          padding: 0.6rem 0.875rem;
          width: 100%;
          outline: none;
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .sb-arcade-input::placeholder {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          color: rgba(255,255,255,0.17);
          text-transform: uppercase;
        }
        .sb-arcade-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-muted), 0 0 12px var(--accent-muted);
        }

        .sb-select {
          background: rgba(38, 50, 38, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          border-radius: 0.625rem;
          padding: 0.65rem 2.25rem 0.65rem 0.875rem;
          width: 100%;
          outline: none;
          font-size: 0.875rem;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          cursor: pointer;
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .sb-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-muted), 0 0 12px var(--accent-muted);
        }
        .sb-select option, .sb-select optgroup {
          background: #0a1a0c;
          color: #fff;
        }

        .sb-field-card {
          background: var(--surface-card);
          border-left: 3px solid var(--accent);
          border-radius: 0.75rem;
          padding: 0.875rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .sb-back {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.875rem;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(255,255,255,0.45);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .sb-back:hover:not(:disabled) {
          border-color: rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.75);
        }
        .sb-back:disabled { opacity: 0.4; cursor: not-allowed; }

        .sb-submit {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.875rem;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .sb-submit-on {
          background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%);
          box-shadow: 0 4px 18px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.12);
          color: #fff;
        }
        .sb-submit-on:active { transform: scale(0.98); }
        .sb-submit-off {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.18);
          cursor: not-allowed;
        }
      `}</style>

      <div className="space-y-3.5">

        {/* ── Goleador ── */}
        <div className="sb-field-card">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base leading-none">⚽</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--accent-light)', lineHeight: 1.2 }}>
                Goleador del torneo
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)', lineHeight: 1.2 }}>
                ¿Quién anota más?
              </p>
            </div>
          </div>
          <input
            type="text"
            value={bonus.topScorer}
            onChange={e => set('topScorer', e.target.value)}
            placeholder="NOMBRE DEL JUGADOR"
            maxLength={50}
            className="sb-arcade-input"
          />
        </div>

        {/* ── Balón de Oro ── */}
        <div className="sb-field-card">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base leading-none">🏆</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--accent-light)', lineHeight: 1.2 }}>
                Balón de Oro
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)', lineHeight: 1.2 }}>
                El mejor jugador
              </p>
            </div>
          </div>
          <input
            type="text"
            value={bonus.goldenBall}
            onChange={e => set('goldenBall', e.target.value)}
            placeholder="NOMBRE DEL JUGADOR"
            maxLength={50}
            className="sb-arcade-input"
          />
        </div>

        {/* ── Fase México ── */}
        <div className="sb-field-card">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base leading-none">🦅</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--accent-light)', lineHeight: 1.2 }}>
                Fase de México
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)', lineHeight: 1.2 }}>
                ¿Hasta dónde llega el Tri?
              </p>
            </div>
          </div>
          <select
            value={bonus.mexicoPhase}
            onChange={e => set('mexicoPhase', e.target.value)}
            className="sb-select"
          >
            <option value="" disabled>Selecciona una fase</option>
            {MEXICO_PHASES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* ── Campeón ── */}
        <div className="sb-field-card">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base leading-none">🌎</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--accent-light)', lineHeight: 1.2 }}>
                Campeón del Mundial
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)', lineHeight: 1.2 }}>
                ¿Quién levanta la copa?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {championTeam && (
              <span className="text-2xl leading-none shrink-0 select-none">
                {championTeam.flag}
              </span>
            )}
            <select
              value={bonus.champion}
              onChange={e => set('champion', e.target.value)}
              className="sb-select"
              style={{ flex: 1, minWidth: 0 }}
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
          </div>
        </div>

        <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Los puntos bonus se calculan al final del torneo.
        </p>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="sb-back"
          >
            ← Atrás
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValid || loading}
            className={`sb-submit ${isValid && !loading ? 'sb-submit-on' : 'sb-submit-off'}`}
          >
            {loading ? 'Guardando…' : '¡Listo! →'}
          </button>
        </div>

      </div>
    </>
  )
}

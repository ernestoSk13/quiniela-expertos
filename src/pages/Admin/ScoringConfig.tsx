import { useState, useEffect } from 'react'
import { useScoringConfig } from '@/hooks/useScoringConfig'
import { saveScoringConfig, type ScoringConfig } from '@/services/firestoreConfig'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

interface FieldDef {
  key: keyof ScoringConfig
  label: string
  description: string
}

const FIELDS: { group: string; emoji: string; fields: FieldDef[] }[] = [
  {
    group: 'Fase de grupos',
    emoji: '⚽',
    fields: [
      { key: 'correctPrediction', label: 'Resultado correcto', description: 'El usuario acierta LOCAL / EMPATE / VISITANTE' },
      { key: 'correctTieWinner', label: 'Bonus tieWinner', description: 'Equipo que avanza correcto en eliminatoria con empate al 90\'' },
    ],
  },
  {
    group: 'Marcador exacto',
    emoji: '🎯',
    fields: [
      { key: 'exactScore',    label: 'Marcador exacto',     description: 'Predijo el marcador exacto (ej. 2-1 correcto)' },
      { key: 'correctResult', label: 'Resultado correcto',  description: 'Resultado correcto pero marcador incorrecto' },
      { key: 'correctGoals',  label: 'Goles de un equipo',  description: 'Por cada equipo cuyos goles acertó (máx. 2 por partido)' },
    ],
  },
  {
    group: 'Bonos',
    emoji: '🏆',
    fields: [
      { key: 'groupBonus',      label: 'Bonus fase de grupos', description: '+pts al jugador con más aciertos al terminar grupos' },
      { key: 'bonusPrediction', label: 'Predicción de bonus',  description: 'Por cada predicción bonus acertada' },
    ],
  },
]

export default function ScoringConfig() {
  const { config, loading } = useScoringConfig()
  const [form, setForm] = useState<ScoringConfig>(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!loading) setForm(config)
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(key: keyof ScoringConfig, value: string) {
    const n = parseInt(value, 10)
    setForm(f => ({ ...f, [key]: isNaN(n) || n < 0 ? 0 : n }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!showWarning) {
      setShowWarning(true)
      return
    }
    setSaving(true)
    try {
      await saveScoringConfig(form)
      setSaved(true)
      setShowWarning(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{styles}</style>

      {/* Page header */}
      <div style={{ marginBottom: 16, maxWidth: 520 }}>
        <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
          CONFIGURACIÓN DE PUNTOS
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Los valores se aplican en la siguiente calificación. No recalifica predicciones ya puntuadas.
        </p>
      </div>

      {/* Mode info banner */}
      <div style={{
        maxWidth: 520, marginBottom: 16,
        background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.2)',
        borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <span style={{ fontSize: '0.85rem', flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <p style={{ fontSize: '0.75rem', color: 'rgba(147,210,240,0.8)', margin: 0, lineHeight: 1.5 }}>
          La app usa dos modos según la jornada.{' '}
          <strong style={{ color: 'rgba(147,210,240,1)' }}>Fase de grupos:</strong> LOCAL / EMPATE / VISITANTE.{' '}
          <strong style={{ color: 'rgba(147,210,240,1)' }}>Fases eliminatorias:</strong> marcador exacto (ej. 2-1).
        </p>
      </div>

      {loading ? (
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="sc-shimmer" style={{ height: 120, borderRadius: 14 }} />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FIELDS.map(({ group, emoji, fields }) => (
            <div key={group} className="sc-card rounded-2xl overflow-hidden">
              {/* Card header */}
              <div style={{
                padding: '10px 16px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1rem' }}>{emoji}</span>
                <span style={{ fontFamily: BEBAS, fontSize: '0.95rem', letterSpacing: '0.12em', color: 'var(--accent-light)' }}>
                  {group}
                </span>
              </div>

              {/* Fields */}
              <div style={{ padding: '4px 0' }}>
                {fields.map(({ key, label, description }) => (
                  <div key={`${group}-${key}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, padding: '12px 16px',
                    borderBottom: fields[fields.length - 1].key === key ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 500 }}>{label}</p>
                      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, margin: 0 }}>{description}</p>
                    </div>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={form[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        className="sc-number-input"
                      />
                      <span style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none',
                        letterSpacing: '0.08em',
                      }}>
                        pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Warning */}
          {showWarning && (
            <div style={{
              background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.25)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(250,204,21,0.9)', margin: 0 }}>
                ⚠ Atención
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(250,204,21,0.6)', margin: 0, lineHeight: 1.5 }}>
                Cambiar los puntos no recalifica predicciones ya puntuadas. Los partidos anteriores mantendrán sus puntos.
                Confirma para guardar de todas formas.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              className="sc-btn-primary px-5 py-2.5 rounded-xl text-sm"
            >
              {saving ? 'Guardando...' : showWarning ? 'Confirmar y guardar' : 'Guardar'}
            </button>
            {showWarning && (
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="sc-btn-ghost px-4 py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
            )}
            {saved && !showWarning && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(74,222,128,0.8)' }}>
                ✓ Guardado
              </span>
            )}
          </div>
        </form>
      )}
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes sc-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .sc-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 800px 100%;
    animation: sc-shimmer 1.6s ease-in-out infinite;
  }

  .sc-card {
    background: var(--surface-card);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .sc-number-input {
    width: 64px;
    text-align: center;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 8px 20px 8px 10px;
    color: white;
    font-family: ${BEBAS};
    font-size: 1.3rem;
    letter-spacing: 0.04em;
    outline: none;
    transition: border-color 0.15s ease;
    -moz-appearance: textfield;
  }
  .sc-number-input:focus { border-color: var(--accent); }
  .sc-number-input::-webkit-outer-spin-button,
  .sc-number-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  .sc-btn-primary {
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .sc-btn-primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .sc-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .sc-btn-ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .sc-btn-ghost:hover { color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.2); }
`

import { useState } from 'react'
import ResultPicker from '@/pages/Predictions/ResultPicker'
import type { PredictionResult } from '@/types'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"
const REAL_RESULT: PredictionResult = 'home'
const PICK_LABELS: Record<PredictionResult, string> = { home: 'LOCAL', draw: 'EMPATE', away: 'VISITANTE' }

interface Props {
  onContinue: () => void
}

// ── Pick phase ────────────────────────────────────────────────────────────────

function PickPhase({ pick, onPick, onReveal }: {
  pick: PredictionResult | null
  onPick: (r: PredictionResult) => void
  onReveal: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 style={{ fontFamily: BEBAS, fontSize: '1.3rem', letterSpacing: '0.06em', color: '#fff', margin: 0, lineHeight: 1 }}>
          ASÍ FUNCIONA
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          Predice el resultado de cada partido antes de que empiece.
        </p>
      </div>

      {/* Match card */}
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 16px 4px' }}>
          {/* Home */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>🇲🇽</span>
            <span style={{ fontFamily: BEBAS, fontSize: '0.95rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)' }}>
              México
            </span>
          </div>
          {/* VS */}
          <span style={{ fontFamily: BEBAS, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)', padding: '0 10px' }}>
            VS
          </span>
          {/* Away */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>🇺🇸</span>
            <span style={{ fontFamily: BEBAS, fontSize: '0.95rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)' }}>
              USA
            </span>
          </div>
        </div>

        <ResultPicker value={pick} savedValue={null} disabled={false} onChange={onPick} />

        <p style={{
          textAlign: 'center', fontSize: '0.7rem', padding: '0 16px 14px',
          color: pick ? 'var(--accent-light)' : 'rgba(255,255,255,0.22)',
          transition: 'color 0.2s ease',
        }}>
          {pick ? '¡Listo! Ahora descubre qué pasó →' : '¿Quién crees que gana?'}
        </p>
      </div>

      <button
        onClick={onReveal}
        disabled={!pick}
        style={pick ? {
          width: '100%', padding: '0.8rem 1rem', borderRadius: '0.875rem', border: 'none',
          background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%)',
          boxShadow: '0 4px 18px var(--accent-muted)', color: '#fff',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        } : {
          width: '100%', padding: '0.8rem 1rem', borderRadius: '0.875rem',
          background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.875rem', fontWeight: 600, cursor: 'not-allowed',
        }}
      >
        Ver resultado
      </button>
    </div>
  )
}

// ── Reveal phase ──────────────────────────────────────────────────────────────

function RevealPhase({ pick, onContinue }: { pick: PredictionResult; onContinue: () => void }) {
  const isCorrect = pick === REAL_RESULT

  const message = isCorrect
    ? '¡Perfecto! Acertar el resultado te da 3 puntos. Cuantos más partidos aciertes, más alto subes en la tabla.'
    : 'Ganó México 2-1. ¡No pasa nada! Cada jornada es una nueva oportunidad para escalar en la tabla.'

  return (
    <>
      <style>{`
        @keyframes sd-pop {
          0%   { opacity: 0; transform: scale(0.4); }
          70%  { transform: scale(1.18); }
          100% { opacity: 1; transform: scale(1); }
        }
        .sd-pop { animation: sd-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div className="ob-enter space-y-5">
        <div>
          <h2 style={{ fontFamily: BEBAS, fontSize: '1.3rem', letterSpacing: '0.06em', color: '#fff', margin: 0, lineHeight: 1 }}>
            RESULTADO REAL
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            Esto es lo que ocurrió en el partido.
          </p>
        </div>

        <div style={{
          borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)', padding: '20px 16px 16px',
        }}>
          {/* Teams + live score */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🇲🇽</span>
              <span style={{ fontFamily: BEBAS, fontSize: '0.95rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)' }}>México</span>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
              <span className="sd-pop" style={{ fontFamily: BEBAS, fontSize: '2.6rem', color: '#fff', lineHeight: 1 }}>2</span>
              <span style={{ fontFamily: BEBAS, fontSize: '1rem', color: 'rgba(255,255,255,0.25)' }}>—</span>
              <span className="sd-pop" style={{ fontFamily: BEBAS, fontSize: '2.6rem', color: '#fff', lineHeight: 1, animationDelay: '0.14s' }}>1</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🇺🇸</span>
              <span style={{ fontFamily: BEBAS, fontSize: '0.95rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)' }}>USA</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

          {/* Pick breakdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>
                Tu pronóstico
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: BEBAS, fontSize: '1rem', letterSpacing: '0.08em',
                  color: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.45)',
                }}>
                  {PICK_LABELS[pick]}
                </span>
                <span style={{ fontSize: '1rem' }}>{isCorrect ? '✓' : '✗'}</span>
              </div>
            </div>

            {/* Points badge */}
            <div className="sd-pop" style={{
              background: isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.28)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: '7px 16px', animationDelay: '0.28s',
            }}>
              <span style={{
                fontFamily: BEBAS, fontSize: '1.4rem', letterSpacing: '0.06em',
                color: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.25)',
              }}>
                {isCorrect ? '+3 pts' : '+0 pts'}
              </span>
            </div>
          </div>

          {/* Message */}
          <p style={{
            fontSize: '0.73rem', color: 'rgba(255,255,255,0.38)', marginTop: 14,
            lineHeight: 1.55, textAlign: 'center',
          }}>
            {message}
          </p>
        </div>

        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '0.8rem 1rem', borderRadius: '0.875rem', border: 'none',
            background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%)',
            boxShadow: '0 4px 18px var(--accent-muted)', color: '#fff',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <span>Continuar</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function StepDemo({ onContinue }: Props) {
  const [pick, setPick] = useState<PredictionResult | null>(null)
  const [phase, setPhase] = useState<'pick' | 'reveal'>('pick')

  if (phase === 'reveal' && pick) {
    return <RevealPhase pick={pick} onContinue={onContinue} />
  }

  return (
    <PickPhase
      pick={pick}
      onPick={setPick}
      onReveal={() => setPhase('reveal')}
    />
  )
}

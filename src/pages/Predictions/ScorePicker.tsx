import type { PredictionResult } from '@/types'

const RESULT_LABELS: Record<PredictionResult, string> = {
  home:  "Victoria Local",
  draw:  "Empate al 90'",
  away:  "Victoria Visitante",
}

function deriveResult(home: number, away: number): PredictionResult {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

interface Props {
  homeGoals: number | null
  awayGoals: number | null
  savedHomeGoals: number | null
  savedAwayGoals: number | null
  disabled: boolean
  onChange: (homeGoals: number, awayGoals: number) => void
}

export default function ScorePicker({
  homeGoals,
  awayGoals,
  savedHomeGoals,
  savedAwayGoals,
  disabled,
  onChange,
}: Props) {
  const isSet = homeGoals !== null && awayGoals !== null
  const savedIsSet = savedHomeGoals !== null && savedAwayGoals !== null

  // In read-only mode show saved value; in edit mode show current value
  const displayH = homeGoals ?? (disabled && savedIsSet ? savedHomeGoals : null)
  const displayA = awayGoals ?? (disabled && savedIsSet ? savedAwayGoals : null)

  const result = displayH !== null && displayA !== null ? deriveResult(displayH, displayA) : null

  const resultColor = result === 'home' || result === 'away'
    ? 'var(--accent-light)'
    : 'rgba(255,200,50,0.75)'

  function adjust(side: 'home' | 'away', delta: number) {
    if (disabled) return
    const h = homeGoals ?? 0
    const a = awayGoals ?? 0
    const newH = side === 'home' ? Math.max(0, Math.min(20, h + delta)) : h
    const newA = side === 'away' ? Math.max(0, Math.min(20, a + delta)) : a
    onChange(newH, newA)
  }

  const scoreColor = isSet
    ? '#ffffff'
    : savedIsSet && disabled
    ? 'rgba(255,255,255,0.55)'
    : 'rgba(255,255,255,0.18)'

  return (
    <div style={{ padding: '12px 12px 10px' }}>
      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>

        {/* Home side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn onClick={() => adjust('home', -1)} disabled={disabled}>−</Btn>
          <span style={{
            fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
            fontSize: '2.2rem',
            letterSpacing: '0.04em',
            color: scoreColor,
            minWidth: 38,
            textAlign: 'center',
            lineHeight: 1,
          }}>
            {displayH ?? '–'}
          </span>
          <Btn onClick={() => adjust('home', +1)} disabled={disabled}>+</Btn>
        </div>

        <span style={{
          fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
          fontSize: '1.8rem',
          color: 'rgba(255,255,255,0.18)',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          :
        </span>

        {/* Away side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn onClick={() => adjust('away', -1)} disabled={disabled}>−</Btn>
          <span style={{
            fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
            fontSize: '2.2rem',
            letterSpacing: '0.04em',
            color: scoreColor,
            minWidth: 38,
            textAlign: 'center',
            lineHeight: 1,
          }}>
            {displayA ?? '–'}
          </span>
          <Btn onClick={() => adjust('away', +1)} disabled={disabled}>+</Btn>
        </div>
      </div>

      {/* Result / hint row */}
      <div style={{ textAlign: 'center', marginTop: 7, minHeight: 18 }}>
        {result ? (
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: resultColor,
          }}>
            {RESULT_LABELS[result]}
          </span>
        ) : !disabled && (
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
            toca +/− para ingresar marcador
          </span>
        )}
      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled }: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)',
        fontSize: '1.25rem',
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.1s ease, color 0.1s ease',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)' }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background = disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.07)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.07)' }}
    >
      {children}
    </button>
  )
}

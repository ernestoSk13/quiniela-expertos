import type { PredictionResult } from '@/types'

const LABELS: Record<PredictionResult, string> = {
  home: 'LOCAL',
  draw: 'EMPATE',
  away: 'VISITANTE',
}

interface Props {
  value: PredictionResult | null
  savedValue: PredictionResult | null
  disabled: boolean
  onChange: (result: PredictionResult) => void
}

export default function ResultPicker({ value, savedValue, disabled, onChange }: Props) {
  return (
    <div className="px-3 py-3 flex gap-2">
      {(['home', 'draw', 'away'] as PredictionResult[]).map(opt => {
        const isActive = value === opt
        const wasSaved = savedValue === opt
        return (
          <button
            key={opt}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className="flex-1 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
            style={{
              background: isActive
                ? 'var(--accent)'
                : wasSaved && disabled
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.04)',
              color: isActive
                ? '#000'
                : wasSaved && disabled
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(255,255,255,0.35)',
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled && !wasSaved && !isActive ? 0.4 : 1,
            }}
          >
            {LABELS[opt]}
          </button>
        )
      })}
    </div>
  )
}

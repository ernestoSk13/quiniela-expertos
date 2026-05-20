interface ScoreBoxProps {
  value: number | null
  selected: boolean
  onSelect: () => void
  onDirectChange: (v: number | null) => void
  readOnly: boolean
}

const BOX_BASE = 'w-11 h-11 rounded-xl text-xl font-bold transition-colors flex items-center justify-center'

function ScoreBox({ value, selected, onSelect, onDirectChange, readOnly }: ScoreBoxProps) {
  const colorClass = selected
    ? 'bg-[var(--accent-muted)] border-2 border-[var(--accent-light)] text-white'
    : value !== null
      ? 'bg-gray-800 border border-gray-700 text-white'
      : 'bg-gray-800/60 border border-gray-800 text-gray-600'

  return (
    <>
      {/* Mobile: tap to select, use keypad */}
      <button
        onClick={readOnly ? undefined : onSelect}
        disabled={readOnly}
        className={`md:hidden ${BOX_BASE} ${colorClass}`}
      >
        {value !== null ? value : '·'}
      </button>

      {/* Desktop: direct input */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={readOnly}
        value={value ?? ''}
        onChange={e => {
          const raw = e.target.value.replace(/\D/g, '')
          onDirectChange(raw === '' ? null : Math.min(99, parseInt(raw, 10)))
        }}
        placeholder="·"
        className={`hidden md:flex ${BOX_BASE} text-center bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none placeholder-gray-600 disabled:opacity-50`}
      />
    </>
  )
}

interface Props {
  homeTeam: string
  awayTeam: string
  homeCode: string
  awayCode: string
  homeFlag: string
  awayFlag: string
  homeScore: number | null
  awayScore: number | null
  selectedSide: 'home' | 'away' | null
  saved: boolean
  isKnockout: boolean
  tieWinner: string | null
  readOnly: boolean
  onSelectHome: () => void
  onSelectAway: () => void
  onDirectHomeChange: (v: number | null) => void
  onDirectAwayChange: (v: number | null) => void
  onSelectTieWinner: (code: string) => void
}

export default function CompactMatchRow({
  homeTeam, awayTeam, homeCode, awayCode, homeFlag, awayFlag,
  homeScore, awayScore, selectedSide, saved,
  isKnockout, tieWinner, readOnly,
  onSelectHome, onSelectAway, onDirectHomeChange, onDirectAwayChange, onSelectTieWinner,
}: Props) {
  const isDraw = homeScore !== null && awayScore !== null && homeScore === awayScore
  const needsTieWinner = isKnockout && isDraw

  return (
    <div className={`rounded-xl border transition-colors ${
      selectedSide ? 'border-[var(--accent-dim)] surface-card' : 'border-gray-800 bg-[var(--surface-card)]/70'
    }`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Home team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-sm text-gray-300 truncate text-right">{homeFlag} {homeCode}</span>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ScoreBox value={homeScore} selected={selectedSide === 'home'} onSelect={onSelectHome} onDirectChange={onDirectHomeChange} readOnly={readOnly} />
          <span className="text-gray-600 font-bold text-sm">—</span>
          <ScoreBox value={awayScore} selected={selectedSide === 'away'} onSelect={onSelectAway} onDirectChange={onDirectAwayChange} readOnly={readOnly} />
        </div>

        {/* Away team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm text-gray-300 truncate">{awayCode} {awayFlag}</span>
        </div>

        {/* Status */}
        <div className="w-4 shrink-0 text-center">
          {saved && <span className="text-[var(--accent)] text-xs">✓</span>}
        </div>
      </div>

      {/* Tie winner selector */}
      {needsTieWinner && !readOnly && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-800/60">
          <p className="text-xs text-gray-500 text-center mb-2">¿Quién avanza?</p>
          <div className="flex gap-2">
            {[
              { code: homeCode, label: `${homeFlag} ${homeTeam}` },
              { code: awayCode, label: `${awayFlag} ${awayTeam}` },
            ].map(team => (
              <button
                key={team.code}
                onClick={() => onSelectTieWinner(team.code)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                  tieWinner === team.code
                    ? 'bg-[var(--accent-hover)] text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {team.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

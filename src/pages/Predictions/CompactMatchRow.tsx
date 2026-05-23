interface ScoreBoxProps {
  value: number | null
  selected: boolean
  onSelect: () => void
  onDirectChange: (v: number | null) => void
  readOnly: boolean
}

function ScoreBox({ value, selected, onSelect, onDirectChange, readOnly }: ScoreBoxProps) {
  const filled = value !== null

  return (
    <>
      {/* Mobile: tap to select, use keypad */}
      <button
        onClick={readOnly ? undefined : onSelect}
        disabled={readOnly}
        className="md:hidden w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
          fontSize: '1.7rem',
          lineHeight: 1,
          transition: 'all 0.1s ease',
          background: selected
            ? 'var(--accent-deep)'
            : filled
            ? 'rgba(50,65,50,0.9)'
            : 'rgba(20,28,20,0.7)',
          border: selected
            ? '2px solid var(--accent-light)'
            : filled
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.05)',
          boxShadow: selected
            ? '0 0 0 2.5px var(--accent), 0 0 20px var(--accent-muted)'
            : filled
            ? '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
            : 'none',
          color: filled ? '#fff' : 'rgba(255,255,255,0.14)',
          transform: selected ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {filled ? value : '–'}
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
        placeholder="–"
        className="hidden md:flex w-12 h-12 rounded-xl items-center justify-center text-center disabled:opacity-40"
        style={{
          fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
          fontSize: '1.7rem',
          lineHeight: 1,
          background: 'rgba(38,50,38,0.8)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: filled ? '#fff' : 'rgba(255,255,255,0.2)',
          outline: 'none',
          transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent), 0 0 14px var(--accent-muted)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.boxShadow = 'none'
        }}
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
  const isActive = !!selectedSide

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: isActive
          ? `linear-gradient(to right, var(--accent-deep) 0%, var(--surface-card) 28%)`
          : 'var(--surface-card)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: isActive ? '2.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isActive
          ? '0 4px 24px rgba(0,0,0,0.35)'
          : '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-3">

        {/* Home team — right-aligned */}
        <div className="flex flex-col items-end flex-1 min-w-0 gap-0.5">
          <span className="text-2xl leading-none select-none">{homeFlag}</span>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {homeCode}
          </span>
        </div>

        {/* Score boxes */}
        <div className="flex items-center gap-1.5 shrink-0 px-1">
          <ScoreBox
            value={homeScore}
            selected={selectedSide === 'home'}
            onSelect={onSelectHome}
            onDirectChange={onDirectHomeChange}
            readOnly={readOnly}
          />
          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '1.1rem', fontWeight: 700 }}>·</span>
          <ScoreBox
            value={awayScore}
            selected={selectedSide === 'away'}
            onSelect={onSelectAway}
            onDirectChange={onDirectAwayChange}
            readOnly={readOnly}
          />
        </div>

        {/* Away team — left-aligned */}
        <div className="flex flex-col items-start flex-1 min-w-0 gap-0.5">
          <span className="text-2xl leading-none select-none">{awayFlag}</span>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {awayCode}
          </span>
        </div>

        {/* Saved badge */}
        <div className="w-5 shrink-0 flex items-center justify-center">
          {saved && (
            <svg viewBox="0 0 16 16" width={16} height={16} fill="none">
              <circle cx="8" cy="8" r="7.5" fill="var(--accent-muted)" />
              <circle cx="8" cy="8" r="7.5" stroke="var(--accent)" strokeWidth="0.8" />
              <path d="M5.5 8.2l1.8 1.8 3.2-3.5"
                stroke="var(--accent-light)" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Tie winner selector */}
      {needsTieWinner && !readOnly && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-center py-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            ¿Quién avanza?
          </p>
          <div className="flex gap-2">
            {[
              { code: homeCode, flag: homeFlag, name: homeTeam },
              { code: awayCode, flag: awayFlag, name: awayTeam },
            ].map(team => {
              const active = tieWinner === team.code
              return (
                <button
                  key={team.code}
                  onClick={() => onSelectTieWinner(team.code)}
                  className="flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl gap-1 transition-all duration-150"
                  style={active ? {
                    background: 'var(--accent-muted)',
                    border: '1px solid var(--accent)',
                    boxShadow: '0 0 10px var(--accent-muted)',
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xl leading-none">{team.flag}</span>
                  <span className="text-[10px] font-black tracking-widest uppercase mt-0.5"
                    style={{ color: active ? 'var(--accent-light)' : 'rgba(255,255,255,0.35)' }}>
                    {team.code}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

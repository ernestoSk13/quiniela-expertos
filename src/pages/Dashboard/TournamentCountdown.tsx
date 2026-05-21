import { useState, useEffect } from 'react'

// Opening match: Mexico vs ?? — June 11, 2026 13:00 UTC
const TOURNAMENT_START = new Date('2026-06-11T13:00:00Z')

function getTimeLeft() {
  const diff = TOURNAMENT_START.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function TournamentCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!timeLeft) return null

  const units = [
    { value: timeLeft.days, label: 'días' },
    { value: timeLeft.hours, label: 'horas' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'seg' },
  ]

  return (
    <div className="surface-card border border-gray-800 rounded-xl p-5 mb-6">
      <p className="text-xs font-semibold text-[var(--accent-light)] uppercase tracking-widest mb-3 text-center">
        Mundial 2026 · Faltan
      </p>
      <div className="flex justify-center gap-3 sm:gap-6">
        {units.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center min-w-[3.5rem]">
            <span className="text-3xl sm:text-4xl font-black tabular-nums text-white leading-none">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

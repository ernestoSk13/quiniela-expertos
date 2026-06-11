import { useState, useEffect } from 'react'

// Opening match: Mexico vs ?? — June 11, 2026 13:00 UTC
const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z')

function getTimeLeft() {
  const diff = TOURNAMENT_START.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
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
    { value: timeLeft.days,    label: 'DÍAS'  },
    { value: timeLeft.hours,   label: 'HORAS' },
    { value: timeLeft.minutes, label: 'MIN'   },
    { value: timeLeft.seconds, label: 'SEG'   },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        .cd-num {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          line-height: 1;
          letter-spacing: 0.02em;
        }
        .cd-sep {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          line-height: 1;
          color: var(--accent);
          opacity: 0.3;
          /* nudge down so colon aligns visually with number top */
          padding-top: 0.1em;
        }
        .cd-accent-rule {
          height: 1px;
          background: linear-gradient(
            to right,
            transparent 0%,
            var(--accent) 25%,
            var(--accent-light) 50%,
            var(--accent) 75%,
            transparent 100%
          );
          opacity: 0.35;
        }
        /* Dot-matrix overlay on numbers row */
        .cd-matrix {
          background-image: radial-gradient(
            circle,
            rgba(0, 0, 0, 0.18) 1px,
            transparent 1px
          );
          background-size: 4px 4px;
        }
        /* Seconds flash on each tick */
        @keyframes cd-tick {
          0%  { opacity: 1; }
          48% { opacity: 1; }
          52% { opacity: 0.6; }
          56% { opacity: 1; }
        }
        .cd-sec { animation: cd-tick 1s ease-in-out infinite; }
      `}</style>

      <div className="mb-8 select-none">

        {/* ── Top broadcast rule ── */}
        <div className="cd-accent-rule mb-4" />

        {/* ── Meta row: Mundial 2026 ←→ Faltan ── */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-semibold tracking-[0.28em] text-gray-600 uppercase">
            Mundial 2026
          </span>
          <span className="text-[10px] font-semibold tracking-[0.28em] text-[var(--accent-light)] uppercase opacity-70">
            Faltan
          </span>
        </div>

        {/* ── Numbers row ── */}
        <div className="cd-matrix rounded-xl py-2 sm:py-3">
          <div className="flex items-start justify-center">
            {units.map(({ value, label }, i) => (
              <div key={label} className="flex items-start">
                {/* Number + label block */}
                <div className="flex flex-col items-center px-2 sm:px-4 md:px-6">
                  <span
                    className={`cd-num text-[4rem] sm:text-[5.5rem] md:text-[6.5rem] tabular-nums text-white ${
                      label === 'SEG' ? 'cd-sec' : ''
                    }`}
                  >
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] sm:text-[9px] tracking-[0.22em] text-gray-600 -mt-1 font-medium uppercase">
                    {label}
                  </span>
                </div>

                {/* Colon separator (not after last) */}
                {i < units.length - 1 && (
                  <span
                    className="cd-sep text-[2.8rem] sm:text-[4rem] md:text-[5rem]"
                    aria-hidden="true"
                  >
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom broadcast rule ── */}
        <div className="cd-accent-rule mt-4" />

      </div>
    </>
  )
}

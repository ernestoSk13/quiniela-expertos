interface Props {
  onDone: () => void
}

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

const INSTRUCTIONS = {
  ios: [
    { text: 'Toca el botón Compartir (cuadro con flecha ↑) en Safari' },
    { text: 'Desplázate y selecciona "Añadir marcador"' },
    { text: 'Elige "Favoritos" y toca "Guardar"' },
  ],
  android: [
    { text: 'Toca el menú (⋮) en la esquina superior derecha de Chrome' },
    { text: 'Toca el ícono ⭐ o selecciona "Añadir a marcadores"' },
  ],
  desktop: [
    { text: 'Presiona Ctrl+D (Windows / Linux) o ⌘+D (Mac)' },
    { text: 'Selecciona "Favoritos" y confirma para guardar' },
  ],
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.5 13H11L10 22L20.5 11H14L13 2Z"/>
    </svg>
  )
}

const BENEFITS = [
  { label: 'Acceso rápido',    Icon: ZapIcon  },
  { label: 'Siempre a mano',   Icon: StarIcon },
  { label: 'Sin perder la URL', Icon: LinkIcon },
]

export default function StepInstall({ onDone }: Props) {
  const platform = detectPlatform()
  const steps = INSTRUCTIONS[platform]

  return (
    <>
      <style>{`
        @keyframes si-star-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px var(--accent))
                    drop-shadow(0 0 24px var(--accent-muted));
          }
          50% {
            filter: drop-shadow(0 0 16px var(--accent-light))
                    drop-shadow(0 0 40px var(--accent-muted));
          }
        }
        .si-star { animation: si-star-glow 2.6s ease-in-out infinite; }

        .si-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.38rem 0.75rem;
          border-radius: 99px;
          background: var(--accent-deep);
          border: 1px solid var(--accent-muted);
          box-shadow: 0 0 10px var(--accent-muted);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--accent-light);
          text-transform: uppercase;
        }

        .si-done {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 0.875rem;
          border: none;
          background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%);
          box-shadow: 0 4px 18px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.12);
          color: #fff;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .si-done:active { transform: scale(0.98); opacity: 0.9; }
      `}</style>

      <div className="space-y-5">

        {/* ── Bookmark illustration ── */}
        <div className="flex justify-center py-2 select-none">
          <div className="si-star">
            <svg width="72" height="88" viewBox="0 0 72 88" fill="none">
              {/* Bookmark ribbon shape */}
              <path
                d="M6 2 H66 Q70 2 70 6 V84 L36 68 L2 84 V6 Q2 2 6 2 Z"
                fill="rgba(0,0,0,0.45)"
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
              {/* Inner highlight */}
              <path
                d="M12 8 H60 Q64 8 64 12 V72 L36 60 L8 72 V12 Q8 8 12 8 Z"
                fill="var(--accent-deep)"
                opacity="0.6"
              />
              {/* Star icon centered */}
              <path
                d="M36 24 l3.6 7.3 8.1 1.2 -5.9 5.7 1.4 8 -7.2-3.8 -7.2 3.8 1.4-8 -5.9-5.7 8.1-1.2 z"
                fill="var(--accent)"
                opacity="0.9"
              />
              {/* Bottom V-cut accent line */}
              <line x1="2" y1="84" x2="36" y2="68" stroke="var(--accent)" strokeWidth="0.5" opacity="0.4"/>
              <line x1="70" y1="84" x2="36" y2="68" stroke="var(--accent)" strokeWidth="0.5" opacity="0.4"/>
            </svg>
          </div>
        </div>

        {/* ── Benefit chips ── */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {BENEFITS.map(({ label, Icon }) => (
            <div key={label} className="si-chip">
              <Icon />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Instructions card ── */}
        <div
          className="rounded-xl p-4 space-y-3.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p
            className="text-[9px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Cómo guardar el acceso
          </p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                style={{
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent-light)',
                  fontFamily: "'Bebas Neue', Impact, sans-serif",
                  fontSize: '0.72rem',
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="space-y-2 pt-1">
          <button onClick={onDone} className="si-done">
            Listo, ya lo guardé
          </button>
          <button
            onClick={onDone}
            className="w-full py-2 text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.22)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
          >
            Omitir por ahora
          </button>
        </div>

      </div>
    </>
  )
}

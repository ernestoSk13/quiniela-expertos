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
    { text: 'Abre Safari y toca el botón Compartir (cuadro con flecha)' },
    { text: 'Desplázate y selecciona "Añadir a pantalla de inicio"' },
    { text: 'Toca "Añadir" para confirmar' },
  ],
  android: [
    { text: 'Toca el menú (tres puntos) en la esquina superior de Chrome' },
    { text: 'Selecciona "Añadir a pantalla de inicio" o "Instalar app"' },
    { text: 'Confirma tocando "Añadir" o "Instalar"' },
  ],
  desktop: [
    { text: 'Haz clic en el ícono de instalación (⊕) en la barra de direcciones' },
    { text: 'Confirma haciendo clic en "Instalar"' },
  ],
}

function LightningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.5 13H11L10 22L20.5 11H14L13 2Z"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  )
}

const BENEFITS = [
  { label: 'Acceso rápido',    Icon: LightningIcon },
  { label: 'Notificaciones',   Icon: BellIcon      },
  { label: 'Sin navegador',    Icon: PhoneIcon     },
]

export default function StepInstall({ onDone }: Props) {
  const platform = detectPlatform()
  const steps = INSTRUCTIONS[platform]

  return (
    <>
      <style>{`
        @keyframes si-phone-glow {
          0%, 100% {
            filter: drop-shadow(0 0 8px var(--accent))
                    drop-shadow(0 0 24px var(--accent-muted));
          }
          50% {
            filter: drop-shadow(0 0 14px var(--accent-light))
                    drop-shadow(0 0 36px var(--accent-muted));
          }
        }
        .si-phone { animation: si-phone-glow 2.6s ease-in-out infinite; }

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

        {/* ── Phone illustration ── */}
        <div className="flex justify-center py-2 select-none">
          <div className="si-phone">
            <svg width="68" height="94" viewBox="0 0 68 94" fill="none">
              {/* Phone shell */}
              <rect x="1.5" y="1.5" width="65" height="91" rx="12"
                fill="rgba(0,0,0,0.55)"
                stroke="var(--accent)"
                strokeWidth="1.5"
              />
              {/* Screen */}
              <rect x="8" y="13" width="52" height="62" rx="6"
                fill="var(--accent-deep)"
                stroke="var(--accent)"
                strokeWidth="0.5"
                opacity="0.75"
              />
              {/* App icon background */}
              <rect x="23" y="28" width="22" height="22" rx="6"
                fill="var(--accent)"
                opacity="0.9"
              />
              {/* Trophy inside icon */}
              <text x="34" y="43" textAnchor="middle" fontSize="11">🏆</text>
              {/* App name label */}
              <text
                x="34" y="62"
                textAnchor="middle"
                fontSize="5.5"
                fill="var(--accent-light)"
                opacity="0.65"
                fontFamily="system-ui, sans-serif"
                fontWeight="700"
                letterSpacing="0.8"
              >
                QUINIELA
              </text>
              {/* Home bar */}
              <rect x="27" y="81" width="14" height="3" rx="1.5"
                fill="var(--accent)"
                opacity="0.35"
              />
              {/* Speaker notch */}
              <rect x="26" y="6.5" width="16" height="3" rx="1.5"
                fill="rgba(255,255,255,0.08)"
              />
              {/* Subtle screen shine */}
              <rect x="8" y="13" width="18" height="62" rx="6"
                fill="rgba(255,255,255,0.02)"
              />
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
            Cómo instalar
          </p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Numbered circle */}
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
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {s.text}
              </p>
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="space-y-2 pt-1">
          <button onClick={onDone} className="si-done">
            Entendido, ya la instalé
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

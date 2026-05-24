import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvite } from '@/services/cloudFunctions'

type State = 'loading' | 'ready' | 'expired' | 'invalid'

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function TrophySVG({ opacity = 1, glow = true }: { opacity?: number; glow?: boolean }) {
  return (
    <svg
      width="52"
      height="64"
      viewBox="0 0 52 64"
      fill="none"
      style={{
        opacity,
        animation: glow ? 'inv-trophy-glow 2.5s ease-in-out infinite' : 'none',
      }}
    >
      <path
        d="M26 46c-10 0-18-8-18-18V10h36v18c0 10-8 18-18 18z"
        fill="var(--accent)"
        opacity="0.9"
      />
      <path
        d="M8 14H2a2 2 0 0 0-2 2v4c0 5.5 3.5 10 8.5 11.5"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M44 14h6a2 2 0 0 1 2 2v4c0 5.5-3.5 10-8.5 11.5"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <rect x="20" y="46" width="12" height="10" rx="1" fill="var(--accent)" opacity="0.7" />
      <rect x="14" y="56" width="24" height="4" rx="2" fill="var(--accent)" opacity="0.8" />
      {/* star on cup */}
      <path
        d="M26 18l1.5 4.5h4.7l-3.8 2.8 1.5 4.5L26 27l-3.9 2.8 1.5-4.5-3.8-2.8h4.7z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  )
}

function OrbitalRing() {
  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'inv-orbit 8s linear infinite',
        pointerEvents: 'none',
      }}
    >
      <circle
        cx="55"
        cy="55"
        r="48"
        stroke="var(--accent)"
        strokeWidth="1"
        strokeDasharray="12 8"
        fill="none"
        opacity="0.2"
      />
      {/* orbiting dot */}
      <circle cx="55" cy="7" r="3" fill="var(--accent)" opacity="0.6" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function XCircleOverlay() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <circle cx="32" cy="32" r="28" stroke="rgba(255,80,50,0.4)" strokeWidth="1.5" fill="none" />
      <line x1="20" y1="20" x2="44" y2="44" stroke="rgba(255,80,50,0.45)" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="20" x2="20" y2="44" stroke="rgba(255,80,50,0.45)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<State>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    getInvite(token)
      .then(({ email: e }) => { setEmail(e); setState('ready') })
      .catch(err => {
        const code = err?.code ?? ''
        setState(code.includes('deadline-exceeded') ? 'expired' : 'invalid')
      })
  }, [token])

  const isError = state === 'expired' || state === 'invalid'

  return (
    <>
      <style>{styles}</style>

      <div
        className="min-h-screen app-bg flex items-center justify-center p-4"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -55deg,
            transparent 0px, transparent 60px,
            rgba(255,255,255,0.013) 60px, rgba(255,255,255,0.013) 62px
          )`,
        }}
      >
        <div
          className="inv-card w-full text-center"
          style={{ maxWidth: 360 }}
        >
          {/* 3px top stripe */}
          <div style={{
            height: 3,
            background: isError
              ? 'linear-gradient(to right, rgba(255,80,50,0.6), rgba(255,80,50,0.2), transparent)'
              : 'linear-gradient(to right, var(--accent-light), var(--accent), transparent)',
          }} />

          {/* ── Top decorative zone ── */}
          <div style={{
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom, var(--accent-deep) 0%, transparent 100%)',
            position: 'relative',
          }}>
            {state !== 'loading' && <OrbitalRing />}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <TrophySVG
                opacity={state === 'loading' ? 0.4 : state === 'expired' ? 0.25 : state === 'invalid' ? 0.2 : 1}
                glow={state === 'ready'}
              />
            </div>
            {/* Expired stamp */}
            {state === 'expired' && (
              <div style={{
                position: 'absolute',
                transform: 'rotate(-12deg)',
                fontFamily: "'Bebas Neue', Impact, sans-serif",
                fontSize: '1.4rem',
                letterSpacing: '0.12em',
                color: 'rgba(255,80,50,0.55)',
                border: '2px solid rgba(255,80,50,0.3)',
                padding: '1px 10px',
                borderRadius: 4,
                lineHeight: 1.3,
                pointerEvents: 'none',
              }}>
                EXPIRADO
              </div>
            )}
            {/* Invalid X overlay */}
            {state === 'invalid' && <XCircleOverlay />}
          </div>

          {/* ── Card body ── */}
          <div style={{ padding: '20px 24px 28px' }}>

            {/* Brand chip */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <span style={{
                background: 'var(--accent-deep)',
                border: '1px solid var(--accent-muted)',
                borderRadius: 99,
                padding: '4px 12px',
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                color: 'var(--accent-light)',
                textTransform: 'uppercase',
              }}>
                Quiniela Expertos · Mundial 2026
              </span>
            </div>

            {/* ── Loading state ── */}
            {state === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div className="inv-shimmer" style={{ height: 28, borderRadius: 6, width: '70%', margin: '0 auto' }} />
                  <div className="inv-shimmer" style={{ height: 12, borderRadius: 4, width: '90%', margin: '0 auto' }} />
                  <div className="inv-shimmer" style={{ height: 12, borderRadius: 4, width: '60%', margin: '0 auto' }} />
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.22em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                  VALIDANDO ACCESO
                  <span className="inv-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              </div>
            )}

            {/* ── Ready state ── */}
            {state === 'ready' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h1 style={{
                  fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                  fontSize: '2.6rem',
                  letterSpacing: '0.06em',
                  color: '#ffffff',
                  lineHeight: 1,
                  margin: 0,
                }}>
                  FUISTE INVITADO
                </h1>

                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.45)',
                  lineHeight: 1.55,
                  margin: 0,
                }}>
                  Únete a la quiniela más competitiva del Mundial 2026.
                </p>

                {email && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    textAlign: 'left',
                  }}>
                    <span style={{ color: 'var(--accent-light)', flexShrink: 0 }}>
                      <UserIcon />
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {email}
                    </span>
                  </div>
                )}

                <Link
                  to={`/login?email=${encodeURIComponent(email)}`}
                  className="inv-cta"
                >
                  ENTRAR AL JUEGO
                </Link>
              </div>
            )}

            {/* ── Expired state ── */}
            {state === 'expired' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h1 style={{
                  fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                  fontSize: '2rem',
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1,
                  margin: 0,
                }}>
                  ACCESO EXPIRADO
                </h1>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.38)',
                  lineHeight: 1.55,
                  margin: 0,
                }}>
                  Este link ya no es válido. Pide al organizador que genere uno nuevo.
                </p>
              </div>
            )}

            {/* ── Invalid state ── */}
            {state === 'invalid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h1 style={{
                  fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                  fontSize: '2rem',
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1,
                  margin: 0,
                }}>
                  LINK INVÁLIDO
                </h1>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.38)',
                  lineHeight: 1.55,
                  margin: 0,
                }}>
                  Este link de invitación no existe o ya fue revocado.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  @keyframes inv-border-pulse {
    0%, 100% {
      box-shadow:
        0 0 0 1px var(--accent-muted),
        0 0 28px var(--accent-muted),
        0 0 60px rgba(0,0,0,0.5);
    }
    50% {
      box-shadow:
        0 0 0 1px var(--accent-muted),
        0 0 48px var(--accent-muted),
        0 0 80px rgba(0,0,0,0.7);
    }
  }

  @keyframes inv-trophy-glow {
    0%, 100% {
      filter: drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 18px var(--accent-muted));
    }
    50% {
      filter: drop-shadow(0 0 14px var(--accent-light)) drop-shadow(0 0 32px var(--accent-muted));
    }
  }

  @keyframes inv-orbit {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @keyframes inv-shimmer {
    0%   { background-position: -300px 0; }
    100% { background-position: 300px 0; }
  }

  @keyframes inv-dot-pulse {
    0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
    40%           { opacity: 1;   transform: translateY(-3px); }
  }

  .inv-card {
    background: var(--surface-card);
    border: 1px solid var(--accent);
    border-radius: 20px;
    overflow: hidden;
    animation: inv-border-pulse 3s ease-in-out infinite;
  }

  .inv-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 600px 100%;
    animation: inv-shimmer 1.6s ease-in-out infinite;
  }

  .inv-dots span {
    display: inline-block;
    animation: inv-dot-pulse 1.2s ease-in-out infinite;
  }
  .inv-dots span:nth-child(2) { animation-delay: 0.15s; }
  .inv-dots span:nth-child(3) { animation-delay: 0.3s; }

  .inv-cta {
    display: block;
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%);
    box-shadow: 0 4px 20px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.12);
    color: #fff;
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1.15rem;
    letter-spacing: 0.1em;
    text-decoration: none;
    text-align: center;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .inv-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .inv-cta:active {
    transform: scale(0.98);
    opacity: 0.92;
  }
`

import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '@/lib/firebase'
import { isEmailAllowed } from '@/services/firestoreUsers'

export default function Login() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const allowed = await isEmailAllowed(result.user.email!)
      if (!allowed) {
        await signOut(auth)
        setError('No tienes acceso. Contacta al administrador.')
      }
      // Si está permitido, AuthContext detecta el cambio y redirige
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') return
      setError('Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        .login-title {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          letter-spacing: 0.04em;
          line-height: 0.92;
        }

        /* Hexagonal pitch texture (subtle) */
        .login-hexbg {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'%3E%3Cpath d='M30 68L2 52V18L30 2l28 16v34L30 68zm0-2l26-15V19L30 4 4 19v32l26 15z' fill='%2300C853' fill-opacity='0.035'/%3E%3C/svg%3E");
        }

        /* Pulsing glow on trophy */
        @keyframes trophy-glow {
          0%, 100% {
            filter: drop-shadow(0 0 14px rgba(0,200,83,0.7))
                    drop-shadow(0 0 40px rgba(0,200,83,0.3));
          }
          50% {
            filter: drop-shadow(0 0 22px rgba(105,240,174,0.9))
                    drop-shadow(0 0 60px rgba(0,200,83,0.5));
          }
        }

        /* Slow outer ring */
        @keyframes ring-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Counter-rotate inner ring */
        @keyframes ring-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        /* Entry animations */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }

        .l-badge  { animation: fade-up  0.55s cubic-bezier(.16,1,.3,1) 0.05s both; }
        .l-trophy { animation: scale-in 0.65s cubic-bezier(.16,1,.3,1) 0.18s both; }
        .l-title  { animation: fade-up  0.55s cubic-bezier(.16,1,.3,1) 0.32s both; }
        .l-card   { animation: fade-up  0.55s cubic-bezier(.16,1,.3,1) 0.46s both; }

        .trophy-emoji {
          animation: trophy-glow 2.8s ease-in-out infinite;
          display: block;
        }

        .ring-outer {
          animation: ring-cw 14s linear infinite;
          transform-origin: center;
        }
        .ring-inner {
          animation: ring-ccw 9s linear infinite;
          transform-origin: center;
        }

        /* Google button */
        .g-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          box-shadow: 0 2px 0 rgba(0,0,0,0.25);
        }
        .g-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,200,83,0.18), 0 2px 0 rgba(0,0,0,0.25);
          background: #f7f7f7;
        }
        .g-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 0 rgba(0,0,0,0.25);
        }

        /* Badge */
        .mundial-badge {
          border: 1px solid rgba(0,200,83,0.35);
          background: rgba(0,200,83,0.07);
        }

        /* Login card */
        .login-card {
          background: linear-gradient(160deg, var(--surface-card) 0%, rgba(5,21,16,0.98) 100%);
          border: 1px solid rgba(0,200,83,0.14);
          box-shadow:
            0 0 0 1px rgba(0,200,83,0.04),
            0 24px 64px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(0,200,83,0.09);
        }

        /* Divider line in card */
        .login-divider {
          border-color: rgba(0,200,83,0.1);
        }
      `}</style>

      <div className="min-h-screen app-bg login-hexbg flex items-center justify-center px-4 py-10 relative overflow-hidden">

        {/* Spotlight bloom behind trophy */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 480,
            height: 480,
            background: 'radial-gradient(circle, var(--accent-muted) 0%, var(--accent-deep) 35%, transparent 70%)',
            opacity: 0.55,
          }}
        />

        {/* Pitch center-circle arc — decorative */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none opacity-[0.04]"
          style={{ top: '18%', left: '50%', transform: 'translateX(-50%)' }}
          width="340" height="340" viewBox="0 0 340 340"
        >
          <circle cx="170" cy="170" r="160" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="170" cy="170" r="110" fill="none" stroke="var(--accent)" strokeWidth="0.8" />
          <line x1="10" y1="170" x2="330" y2="170" stroke="var(--accent)" strokeWidth="0.8" />
        </svg>

        <div className="w-full max-w-[22rem] relative z-10">

          {/* ── MUNDIAL 2026 badge ── */}
          <div className="l-badge flex justify-center mb-7">
            <div className="mundial-badge rounded-full px-5 py-1.5 flex items-center gap-2.5">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M4 0L5 3H8L5.5 5L6.5 8L4 6L1.5 8L2.5 5L0 3H3L4 0Z"
                  fill="var(--accent)" />
              </svg>
              <span
                className="text-[var(--accent-light)] tracking-[0.22em] text-[11px] font-semibold"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                MUNDIAL 2026
              </span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M4 0L5 3H8L5.5 5L6.5 8L4 6L1.5 8L2.5 5L0 3H3L4 0Z"
                  fill="var(--accent)" />
              </svg>
            </div>
          </div>

          {/* ── Trophy with orbital rings ── */}
          <div className="l-trophy flex justify-center mb-5">
            <div className="relative w-36 h-36 flex items-center justify-center">

              {/* Outer dashed orbital ring */}
              <svg className="ring-outer absolute inset-0 w-full h-full" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="66"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="0.6"
                  strokeDasharray="5 9"
                  opacity="0.45"
                />
                {/* 4 accent dots on the ring */}
                {[0, 90, 180, 270].map(deg => {
                  const r = 66, cx = 72, cy = 72
                  const rad = (deg * Math.PI) / 180
                  const x = cx + r * Math.cos(rad)
                  const y = cy + r * Math.sin(rad)
                  return <circle key={deg} cx={x} cy={y} r="2" fill="var(--accent)" opacity="0.6" />
                })}
              </svg>

              {/* Inner solid ring */}
              <svg className="ring-inner absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36"
                  fill="none"
                  stroke="var(--accent-light)"
                  strokeWidth="0.4"
                  strokeDasharray="2 6"
                  opacity="0.25"
                />
              </svg>

              {/* Static glow disc */}
              <div
                className="absolute inset-5 rounded-full"
                style={{
                  background: 'radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)',
                  boxShadow: '0 0 24px var(--accent-muted)',
                }}
              />

              {/* Trophy */}
              <span className="trophy-emoji text-6xl select-none relative z-10">🏆</span>
            </div>
          </div>

          {/* ── Title ── */}
          <div className="l-title text-center mb-8">
            <h1
              className="login-title text-white"
              style={{ fontSize: 'clamp(3.4rem, 14vw, 5rem)' }}
            >
              QUINIELA<br />EXPERTOS
            </h1>
            <p className="text-[var(--accent-light)] text-xs tracking-[0.28em] mt-2.5 opacity-60 uppercase">
              El juego de los expertos
            </p>
          </div>

          {/* ── Card ── */}
          <div className="l-card login-card rounded-2xl p-5">

            {/* Subtle header */}
            <p className="text-center text-[10px] tracking-[0.2em] text-gray-600 uppercase font-medium mb-4">
              Acceso exclusivo
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="g-btn w-full flex items-center justify-center gap-3 bg-white disabled:opacity-50 text-gray-900 font-medium py-3.5 px-4 rounded-xl text-sm"
            >
              <GoogleIcon />
              {loading ? 'Entrando…' : 'Continuar con Google'}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center mt-3 leading-relaxed">{error}</p>
            )}

            <hr className="login-divider mt-5 mb-0 border-t" />
            <p className="text-[10px] text-gray-700 text-center mt-3 leading-relaxed">
              Acceso solo por invitación
            </p>
          </div>

        </div>
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

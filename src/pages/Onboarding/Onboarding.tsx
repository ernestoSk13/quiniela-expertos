import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTeamsMap } from '@/hooks/useTeams'
import { getAvatarUrl, uploadAvatar } from '@/services/storageAvatars'
import { updateUserProfile } from '@/services/firestoreUsers'
import StepProfile from './StepProfile'
import StepBonus from './StepBonus'
import StepInstall from './StepInstall'
import type { BonusPredictions } from '@/types/User'

// Detecta si la app ya está corriendo como PWA instalada
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true

const EMPTY_BONUS: BonusPredictions = {
  topScorer: '',
  goldenBall: '',
  mexicoPhase: '',
  champion: '',
  pointsAwarded: false,
}

const STEP_LABELS: Record<number, string> = {
  1: 'PERFIL',
  2: 'PRONÓSTICOS',
  3: 'INSTALAR',
}

export default function Onboarding() {
  const { user } = useAuth()
  const { teamsMap, loading: teamsLoading } = useTeamsMap()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const totalSteps = isStandalone ? 2 : 3
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl ?? '')
  const [bonus, setBonus] = useState<BonusPredictions>(EMPTY_BONUS)
  const [loading, setLoading] = useState(false)

  function handleFileChange(file: File) {
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleProfileContinue() {
    if (!avatarFile && !previewUrl) {
      const existing = await getAvatarUrl(displayName)
      if (existing) setPreviewUrl(existing)
    }
    setStep(2)
  }

  async function handleBonusSubmit() {
    if (!user) return
    setLoading(true)
    try {
      let avatarUrl = previewUrl

      if (avatarFile) {
        avatarUrl = await uploadAvatar(displayName, avatarFile)
      } else if (!avatarUrl) {
        const existing = await getAvatarUrl(displayName)
        avatarUrl = existing ?? ''
      }

      if (isStandalone) {
        // Ya es PWA: guardar todo incluyendo onboardingCompleted → AuthContext redirige
        await updateUserProfile(user.uid, {
          displayName: displayName.trim(),
          avatarUrl,
          bonusPredictions: { ...bonus, pointsAwarded: false },
          onboardingCompleted: true,
        })
      } else {
        // No es PWA: guardar perfil SIN onboardingCompleted para que AuthGuard
        // no redirija al dashboard antes de mostrar el paso 3
        await updateUserProfile(user.uid, {
          displayName: displayName.trim(),
          avatarUrl,
          bonusPredictions: { ...bonus, pointsAwarded: false },
        })
        setStep(3)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error al guardar onboarding:', err)
      setLoading(false)
    }
  }

  // Paso 3: el usuario hace clic en "Ya la instalé" u "Omitir"
  // Solo aquí se marca onboardingCompleted: true → AuthContext redirige al dashboard
  async function handleInstallDone() {
    if (!user) return
    await updateUserProfile(user.uid, { onboardingCompleted: true })
  }

  const teams = Object.values(teamsMap)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        .ob-bg {
          background-image: repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 60px,
            rgba(255,255,255,0.013) 60px,
            rgba(255,255,255,0.013) 62px
          );
        }

        .ob-title {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          letter-spacing: 0.06em;
          line-height: 1;
        }

        .ob-card-stripe {
          height: 3px;
          background: linear-gradient(
            to right,
            var(--accent-light),
            var(--accent) 45%,
            transparent 100%
          );
        }

        @keyframes ob-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--accent-muted); }
          50%       { box-shadow: 0 0 0 4px var(--accent-muted); }
        }
        .ob-step-current { animation: ob-ring-pulse 1.6s ease-in-out infinite; }

        @keyframes ob-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ob-enter { animation: ob-fade-up 0.4s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="min-h-screen app-bg ob-bg text-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* ── Title ── */}
          <div className="text-center mb-6 select-none">
            <p
              className="text-[9px] tracking-[0.3em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              Bienvenido a
            </p>
            <h1
              className="ob-title text-white"
              style={{ fontSize: 'clamp(2.1rem, 9vw, 2.8rem)' }}
            >
              QUINIELA EXPERTOS
            </h1>
            <p
              className="text-[10px] tracking-[0.24em] uppercase font-semibold mt-2"
              style={{ color: 'var(--accent-light)', opacity: 0.8 }}
            >
              PASO {step} — {STEP_LABELS[step]}
            </p>
          </div>

          {/* ── Step progress circles ── */}
          <div className="flex items-center justify-center mb-7 select-none">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n, i) => {
              const completed = n < step
              const current   = n === step

              return (
                <div key={n} className="flex items-center">
                  {/* Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${current ? 'ob-step-current' : ''}`}
                    style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      fontSize: '0.95rem',
                      background: completed
                        ? 'var(--accent)'
                        : current
                        ? 'var(--accent-muted)'
                        : 'rgba(255,255,255,0.05)',
                      border: completed || current
                        ? '2px solid var(--accent)'
                        : '2px solid rgba(255,255,255,0.1)',
                      color: completed
                        ? '#000'
                        : current
                        ? 'var(--accent-light)'
                        : 'rgba(255,255,255,0.22)',
                    }}
                  >
                    {completed ? (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l2.8 2.8L10 3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : n}
                  </div>

                  {/* Connector line */}
                  {i < totalSteps - 1 && (
                    <div
                      className="w-10 h-px mx-1 transition-all duration-500"
                      style={{
                        background: n < step
                          ? 'var(--accent)'
                          : 'rgba(255,255,255,0.07)',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Content card ── */}
          <div
            key={step}
            className="ob-enter rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
            }}
          >
            <div className="ob-card-stripe" />
            <div className="p-5">
              {step === 1 && (
                <StepProfile
                  displayName={displayName}
                  previewUrl={previewUrl}
                  onDisplayNameChange={setDisplayName}
                  onFileChange={handleFileChange}
                  onContinue={handleProfileContinue}
                  loading={false}
                />
              )}
              {step === 2 && (
                <StepBonus
                  bonus={bonus}
                  teams={teamsLoading ? [] : teams}
                  onBonusChange={setBonus}
                  onBack={() => setStep(1)}
                  onSubmit={handleBonusSubmit}
                  loading={loading}
                />
              )}
              {step === 3 && (
                <StepInstall onDone={handleInstallDone} />
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

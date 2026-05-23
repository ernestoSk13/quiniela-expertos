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
    <div className="min-h-screen app-bg text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">
            Bienvenido a Quiniela Expertos
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 1 ? 'Configura tu perfil' : step === 2 ? 'Pronósticos de inicio' : 'Instala la app'}
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
              <div
                key={n}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  n <= step ? 'bg-[var(--accent)]' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
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
  )
}

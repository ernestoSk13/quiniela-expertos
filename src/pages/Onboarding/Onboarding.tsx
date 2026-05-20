import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTeamsMap } from '@/hooks/useTeams'
import { getAvatarUrl, uploadAvatar } from '@/services/storageAvatars'
import { updateUserProfile } from '@/services/firestoreUsers'
import StepProfile from './StepProfile'
import StepBonus from './StepBonus'
import type { BonusPredictions } from '@/types/User'

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

  const [step, setStep] = useState<1 | 2>(1)
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

  async function handleSubmit() {
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

      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        avatarUrl,
        bonusPredictions: { ...bonus, pointsAwarded: false },
        onboardingCompleted: true,
      })
      // AuthContext onSnapshot will pick up onboardingCompleted: true
      // and OnboardingRoute will redirect automatically
    } catch (err) {
      console.error('Error al guardar onboarding:', err)
      setLoading(false)
    }
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
            {step === 1 ? 'Configura tu perfil' : 'Pronósticos de inicio'}
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map(n => (
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
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

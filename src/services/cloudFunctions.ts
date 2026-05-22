import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'

const functions = getFunctions()

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFunctionsEmulator(
    functions,
    import.meta.env.VITE_EMULATOR_HOST ?? 'localhost',
    5001,
  )
}

export async function getInvite(token: string): Promise<{ email: string }> {
  const fn = httpsCallable<{ token: string }, { email: string }>(functions, 'getInvite')
  const result = await fn({ token })
  return result.data
}

export async function evaluateBonusPredictions(actual: {
  topScorer: string
  goldenBall: string
  mexicoPhase: string
  champion: string
}): Promise<void> {
  const fn = httpsCallable(functions, 'evaluateBonusPredictions')
  await fn(actual)
}

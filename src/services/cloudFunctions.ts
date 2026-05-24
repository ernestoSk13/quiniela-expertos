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

export async function sendMassNotification(
  title: string,
  body: string,
): Promise<{ sent: number }> {
  const fn = httpsCallable<{ title: string; body: string }, { sent: number }>(
    functions,
    'sendMassNotification',
  )
  const result = await fn({ title, body })
  return result.data
}

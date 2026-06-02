import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User, UserRole } from '@/types'
import type { BonusPredictions } from '@/types/User'
import type { ThemeId } from '@/lib/themes'

export async function isEmailAllowed(email: string): Promise<boolean> {
  const ref = doc(db, 'allowedUsers', email.toLowerCase())
  const snap = await getDoc(ref)
  return snap.exists()
}

export async function updateUserProfile(
  uid: string,
  data: {
    displayName?: string
    avatarUrl?: string
    bonusPredictions?: {
      topScorer: string
      goldenBall: string
      mexicoPhase: string
      champion: string
      pointsAwarded: boolean
    }
    onboardingCompleted?: boolean
  },
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function updateBonusPredictions(
  uid: string,
  bonusPredictions: BonusPredictions,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { bonusPredictions })
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => d.data() as User)
}

export async function updateUserTheme(uid: string, theme: ThemeId): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { theme })
}

export async function adminUpdateUser(
  uid: string,
  data: { displayName: string; avatarUrl: string; role: UserRole },
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function saveUserTimezone(uid: string, timezone: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    timezone: timezone || deleteField(),
  })
}

export async function saveFcmToken(uid: string, token: string | null): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    fcmToken: token ?? deleteField(),
  })
}

export async function ensureUserDoc(fbUser: FirebaseUser): Promise<void> {
  const ref = doc(db, 'users', fbUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  await setDoc(ref, {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName ?? '',
    avatarUrl: '',
    onboardingCompleted: false,
    role: 'player',
    createdAt: serverTimestamp(),
    bonusPredictions: {
      topScorer: '',
      goldenBall: '',
      mexicoPhase: '',
      champion: '',
      pointsAwarded: false,
    },
    stats: {
      totalPoints: 0,
      correctPredictions: 0,
      totalPredictions: 0,
    },
  })
}

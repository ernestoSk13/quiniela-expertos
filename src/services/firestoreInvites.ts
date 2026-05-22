import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function generateInviteLink(email: string): Promise<string> {
  const token = crypto.randomUUID()
  await setDoc(doc(db, 'invites', token), {
    email,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + INVITE_TTL_MS)),
  })
  return `${window.location.origin}/invite/${token}`
}

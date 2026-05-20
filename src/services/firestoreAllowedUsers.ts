import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function getAllowedUsers(): Promise<string[]> {
  const snap = await getDocs(collection(db, 'allowedUsers'))
  return snap.docs.map(d => d.id)
}

export async function addAllowedUser(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim()
  await setDoc(doc(db, 'allowedUsers', normalized), {
    email: normalized,
    addedAt: serverTimestamp(),
  })
}

export async function removeAllowedUser(email: string): Promise<void> {
  await deleteDoc(doc(db, 'allowedUsers', email.toLowerCase().trim()))
}

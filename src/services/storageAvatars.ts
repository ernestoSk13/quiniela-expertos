import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'

function avatarPath(displayName: string): string {
  return `avatars/${displayName.toLowerCase().trim()}.png`
}

/** Intenta obtener la URL del avatar subido por el admin. Retorna null si no existe. */
export async function getAvatarUrl(displayName: string): Promise<string | null> {
  try {
    return await getDownloadURL(ref(storage, avatarPath(displayName)))
  } catch {
    return null
  }
}

/** Sube la foto del usuario sobreescribiendo el archivo existente. */
export async function uploadAvatar(displayName: string, file: File): Promise<string> {
  const storageRef = ref(storage, avatarPath(displayName))
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

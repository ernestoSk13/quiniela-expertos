import { useState, useEffect } from 'react'
import { getMessaging, getToken, deleteToken } from 'firebase/messaging'
import { app } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { saveFcmToken } from '@/services/firestoreUsers'

const VAPID_KEY = import.meta.env.VITE_VAPID_KEY
const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true'

// Firebase Messaging no funciona con emuladores
const isMessagingSupported =
  !USE_EMULATORS &&
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isMessagingSupported) {
      setPermission(Notification.permission)
    }
  }, [])

  // El usuario tiene notificaciones activas si tiene permiso Y token guardado
  const isEnabled = permission === 'granted' && !!user?.fcmToken

  async function enable() {
    if (!isMessagingSupported || !user) return
    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const messaging = getMessaging(app)
      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
      if (token) await saveFcmToken(user.uid, token)
    } catch (err) {
      console.error('[push] Error al activar:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function disable() {
    if (!isMessagingSupported || !user) return
    setIsLoading(true)
    try {
      const messaging = getMessaging(app)
      await deleteToken(messaging)
      await saveFcmToken(user.uid, null)
    } catch (err) {
      console.error('[push] Error al desactivar:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function toggle() {
    return isEnabled ? disable() : enable()
  }

  return {
    isSupported: isMessagingSupported,
    permission,
    isEnabled,
    isLoading,
    toggle,
  }
}

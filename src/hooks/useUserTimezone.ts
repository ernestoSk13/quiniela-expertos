import { useAuth } from '@/context/AuthContext'

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

export function useUserTimezone(): string {
  const { user } = useAuth()
  return user?.timezone || BROWSER_TZ
}

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { isEmailAllowed, ensureUserDoc } from '@/services/firestoreUsers'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const userUnsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let cancelled = false

    const unsubAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      // Cancela el listener del usuario anterior si había uno
      if (userUnsubRef.current) {
        userUnsubRef.current()
        userUnsubRef.current = null
      }

      if (!fbUser?.email) {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const allowed = await isEmailAllowed(fbUser.email)
      if (cancelled) return

      if (!allowed) {
        await signOut(auth)
        return
      }

      await ensureUserDoc(fbUser)
      if (cancelled) return

      // Listener en tiempo real para que cambios en Firestore reflejen en el estado
      const userRef = doc(db, 'users', fbUser.uid)
      userUnsubRef.current = onSnapshot(userRef, (snap) => {
        if (!cancelled && snap.exists()) {
          setUser(snap.data() as User)
          setLoading(false)
        }
      })
    })

    return () => {
      cancelled = true
      unsubAuth()
      if (userUnsubRef.current) userUnsubRef.current()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

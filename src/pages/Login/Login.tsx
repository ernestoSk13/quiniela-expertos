import { type FormEvent, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '@/lib/firebase'
import { isEmailAllowed } from '@/services/firestoreUsers'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const allowed = await isEmailAllowed(email)
      if (!allowed) {
        setError('No tienes acceso. Contacta al administrador.')
        return
      }
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)

    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const allowed = await isEmailAllowed(result.user.email!)
      if (!allowed) {
        await signOut(auth)
        setError('No tienes acceso. Contacta al administrador.')
      }
      // Si está permitido, AuthContext detecta el cambio y redirige
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') return
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen app-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-2xl font-bold text-white">Quiniela Expertos</h1>
          <p className="text-[var(--accent-light)] font-medium mt-1">Mundial 2026</p>
        </div>

        {/* Card */}
        <div className="surface-card border border-gray-800 rounded-2xl p-6 space-y-4">

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-500 text-sm">o</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-4 py-3 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-4 py-3 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.'
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta más tarde.'
      case 'auth/invalid-email':
        return 'El correo no tiene un formato válido.'
      default:
        return 'Error al iniciar sesión. Intenta de nuevo.'
    }
  }
  return 'Error inesperado. Intenta de nuevo.'
}

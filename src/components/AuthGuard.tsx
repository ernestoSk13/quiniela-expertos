import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from './LoadingScreen'

/** Rutas de la app principal: requiere auth + onboarding completado */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** Ruta de onboarding: requiere auth, redirige si ya completó el onboarding */
export function OnboardingRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.onboardingCompleted) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Ruta de admin: requiere auth + role admin (no requiere onboarding) */
export function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Ruta pública (login): redirige si ya está autenticado */
export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user?.onboardingCompleted) return <Navigate to="/dashboard" replace />
  if (user && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

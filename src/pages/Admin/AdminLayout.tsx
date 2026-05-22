import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/Avatar'
import { resetAllData } from '@/services/firestoreAdmin'

// Mobile tab bar (space-constrained — 4 items max)
const MOBILE_NAV = [
  { to: '/admin',           label: 'Jornadas',  end: true },
  { to: '/admin/jugadores', label: 'Jugadores' },
  { to: '/admin/bonus',     label: 'Bonus' },
  { to: '/admin/usuarios',  label: 'Acceso' },
]

// Desktop header nav (can fit more items)
const DESKTOP_NAV = [
  ...MOBILE_NAV,
  { to: '/admin/tabla',  label: 'Tabla' },
  { to: '/admin/config', label: 'Puntos' },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [resetting, setResetting] = useState(false)

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  async function handleReset() {
    const confirmed = window.confirm(
      '¿Restaurar todos los datos?\n\n' +
      '· Onboarding de jugadores → pendiente (verán el flujo al entrar)\n' +
      '· Puntos y pronósticos bonus → cero\n' +
      '· Marcadores de partidos → eliminados\n' +
      '· Todos los pronósticos → eliminados\n\n' +
      'Los perfiles, avatares y admins se conservan. Esta acción no se puede deshacer.',
    )
    if (!confirmed) return
    setResetting(true)
    try {
      await resetAllData()
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen app-bg text-white">

      {/* Header */}
      <header className="border-b border-gray-800 surface-nav sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo + desktop nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 shrink-0">
              <Avatar url={user?.avatarUrl ?? ''} name={user?.displayName || 'Admin'} size="sm" />
              <span className="font-bold text-[var(--accent-light)]">Admin</span>
            </div>

            {/* Desktop only */}
            <nav className="hidden md:flex gap-1">
              {DESKTOP_NAV.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 hidden sm:block truncate max-w-[160px]">{user?.email}</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors shrink-0"
              title="Restaurar todos los datos"
            >
              {resetting ? '...' : 'Restaurar'}
            </button>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white transition-colors shrink-0"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content — extra bottom padding on mobile for the tab bar */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 surface-nav border-t border-gray-800 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors gap-0.5 ${
                isActive ? 'text-[var(--accent-light)]' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-1 h-1 rounded-full mb-0.5 transition-colors ${isActive ? 'bg-[var(--accent-light)]' : 'bg-transparent'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}

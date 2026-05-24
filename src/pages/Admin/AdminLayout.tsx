import { useState, type JSX } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/Avatar'
import { resetAllData } from '@/services/firestoreAdmin'

const MOBILE_NAV = [
  { to: '/admin',           label: 'Jornadas',  end: true },
  { to: '/admin/jugadores', label: 'Jugadores' },
  { to: '/admin/bonus',     label: 'Bonus' },
  { to: '/admin/usuarios',  label: 'Acceso' },
]

const DESKTOP_NAV = [
  ...MOBILE_NAV,
  { to: '/admin/tabla',  label: 'Tabla' },
  { to: '/admin/config', label: 'Puntos' },
]

// ── Icons ──────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const NAV_ICONS: Record<string, JSX.Element> = {
  '/admin':           <CalendarIcon />,
  '/admin/jugadores': <UsersIcon />,
  '/admin/bonus':     <StarIcon />,
  '/admin/usuarios':  <ShieldIcon />,
  '/admin/tabla':     <TableIcon />,
  '/admin/config':    <GearIcon />,
}

// ── Main component ─────────────────────────────────────────────────────────────

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
    <>
      <style>{styles}</style>
      <div className="min-h-screen app-bg text-white">

        {/* ── Header ── */}
        <header className="adm-header sticky top-0 z-10">
          {/* 3px accent top stripe */}
          <div style={{
            height: 3,
            background: 'linear-gradient(to right, var(--accent-light), var(--accent), transparent)',
          }} />

          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

            {/* Logo + desktop nav */}
            <div className="flex items-center gap-6">
              {/* Brand */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Avatar url={user?.avatarUrl ?? ''} name={user?.displayName || 'Admin'} size="sm" />
                <div>
                  <div style={{
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    marginBottom: 2,
                  }}>
                    Quiniela Expertos
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                    fontSize: '1rem',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-light)',
                    lineHeight: 1,
                  }}>
                    ADMIN
                  </div>
                </div>
              </div>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-0.5">
                {DESKTOP_NAV.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `adm-nav-item ${isActive ? 'adm-nav-active' : ''}`
                    }
                  >
                    <span className="adm-nav-icon">{NAV_ICONS[to]}</span>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {user?.email}
              </span>
              <div className="hidden sm:block" style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
              <button
                onClick={handleReset}
                disabled={resetting}
                className="adm-btn-danger"
              >
                {resetting ? '···' : 'Restaurar'}
              </button>
              <button
                onClick={handleSignOut}
                className="adm-btn-ghost"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="max-w-6xl mx-auto px-4 py-8 pb-28 md:pb-10">
          <Outlet />
        </main>

        {/* ── Bottom tab bar (mobile) ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex adm-tabbar"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {MOBILE_NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `adm-tab ${isActive ? 'adm-tab-active' : ''}`
              }
            >
              {NAV_ICONS[to]}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  .adm-header {
    background: var(--surface-nav);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .adm-nav-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 500;
    color: rgba(255,255,255,0.38);
    text-decoration: none;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .adm-nav-item:hover {
    color: rgba(255,255,255,0.8);
    background: rgba(255,255,255,0.05);
  }
  .adm-nav-active {
    color: var(--accent-light) !important;
    background: var(--accent-deep) !important;
  }
  .adm-nav-icon {
    opacity: 0.6;
    display: flex;
    align-items: center;
  }
  .adm-nav-active .adm-nav-icon { opacity: 1; }

  .adm-btn-danger {
    font-size: 0.7rem;
    padding: 4px 10px;
    border-radius: 7px;
    border: 1px solid rgba(239,68,68,0.22);
    color: rgba(239,68,68,0.5);
    background: transparent;
    transition: all 0.15s ease;
    cursor: pointer;
    white-space: nowrap;
  }
  .adm-btn-danger:hover:not(:disabled) {
    color: #ef4444;
    border-color: rgba(239,68,68,0.5);
    background: rgba(239,68,68,0.07);
  }
  .adm-btn-danger:disabled { opacity: 0.35; cursor: not-allowed; }

  .adm-btn-ghost {
    font-size: 0.7rem;
    padding: 4px 10px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.32);
    background: transparent;
    transition: all 0.15s ease;
    cursor: pointer;
    white-space: nowrap;
  }
  .adm-btn-ghost:hover {
    color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
  }

  .adm-tabbar {
    background: var(--surface-nav);
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .adm-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 0 7px;
    gap: 4px;
    font-size: 0.58rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .adm-tab:hover { color: rgba(255,255,255,0.55); }
  .adm-tab-active { color: var(--accent-light) !important; }
`

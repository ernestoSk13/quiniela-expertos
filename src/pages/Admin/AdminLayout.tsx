import { useEffect, useState, type JSX } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/Avatar'
import { resetAllData } from '@/services/firestoreAdmin'

const MOBILE_NAV = [
  { to: '/admin',            label: 'Jornadas', end: true },
  { to: '/admin/jugadores',  label: 'Jugadores' },
  { to: '/admin/usuarios',   label: 'Acceso' },
  { to: '/admin/tabla',      label: 'Tabla' },
]

// Secciones ocultas bajo "Más" en móvil
const MORE_NAV = [
  { to: '/admin/bonus',           label: 'Bonus' },
  { to: '/admin/metricas',        label: 'Métricas' },
  { to: '/admin/notificaciones',  label: 'Notificaciones' },
  { to: '/admin/config',          label: 'Puntos' },
]

const MORE_PATHS = MORE_NAV.map(n => n.to)

const DESKTOP_NAV = [
  { to: '/admin',                   label: 'Jornadas',        end: true },
  { to: '/admin/jugadores',         label: 'Jugadores' },
  { to: '/admin/bonus',             label: 'Bonus' },
  { to: '/admin/usuarios',          label: 'Acceso' },
  { to: '/admin/tabla',             label: 'Tabla' },
  { to: '/admin/metricas',          label: 'Métricas' },
  { to: '/admin/notificaciones',    label: 'Notifs' },
  { to: '/admin/config',            label: 'Puntos' },
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

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1.5" />
      <rect x="14" y="3"  width="7" height="7" rx="1.5" />
      <rect x="3"  y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

const NAV_ICONS: Record<string, JSX.Element> = {
  '/admin':                   <CalendarIcon />,
  '/admin/jugadores':         <UsersIcon />,
  '/admin/bonus':             <StarIcon />,
  '/admin/usuarios':          <ShieldIcon />,
  '/admin/tabla':             <TableIcon />,
  '/admin/metricas':          <ChartIcon />,
  '/admin/notificaciones':    <BellIcon />,
  '/admin/config':            <GearIcon />,
}

const MORE_ICONS: Record<string, JSX.Element> = {
  '/admin/bonus':          <StarIcon />,
  '/admin/metricas':       <ChartIcon />,
  '/admin/notificaciones': <BellIcon />,
  '/admin/config':         <GearIcon />,
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [resetting, setResetting] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = MORE_PATHS.some(p => location.pathname.startsWith(p))

  // Cierra el panel "Más" al navegar
  useEffect(() => { setShowMore(false) }, [location.pathname])

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
              <nav className="hidden md:flex items-center gap-0">
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

        {/* ── "Más" panel (slide-up sobre tab bar) ── */}
        {showMore && (
          <div className="md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowMore(false)}
            />
            {/* Panel */}
            <div
              className="fixed left-3 right-3 z-40 rounded-2xl overflow-hidden adm-more-panel"
              style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
            >
              {MORE_NAV.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `adm-more-item ${isActive ? 'adm-more-active' : ''}`
                  }
                >
                  <span className="adm-more-icon">{MORE_ICONS[to]}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

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

          {/* Tab "Más" */}
          <button
            className={`adm-tab ${isMoreActive || showMore ? 'adm-tab-active' : ''}`}
            onClick={() => setShowMore(v => !v)}
          >
            <MoreIcon />
            <span>Más</span>
          </button>
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
    gap: 4px;
    padding: 5px 8px;
    border-radius: 7px;
    font-size: 0.72rem;
    font-weight: 500;
    color: rgba(255,255,255,0.38);
    text-decoration: none;
    transition: color 0.15s ease, background 0.15s ease;
    white-space: nowrap;
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
    padding: 8px 2px 6px;
    gap: 3px;
    font-size: 0.54rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .adm-tab svg { width: 15px; height: 15px; }
  .adm-tab:hover { color: rgba(255,255,255,0.55); }
  .adm-tab-active { color: var(--accent-light) !important; }

  /* ── Panel "Más" ── */
  .adm-more-panel {
    background: var(--surface-nav);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
    animation: adm-slide-up 0.18s ease;
  }
  @keyframes adm-slide-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .adm-more-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    font-size: 0.88rem;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: background 0.12s ease, color 0.12s ease;
  }
  .adm-more-item:last-child { border-bottom: none; }
  .adm-more-item:hover {
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.9);
  }
  .adm-more-active {
    color: var(--accent-light) !important;
    background: var(--accent-deep) !important;
  }
  .adm-more-icon {
    display: flex;
    align-items: center;
    opacity: 0.6;
  }
  .adm-more-active .adm-more-icon { opacity: 1; }
`

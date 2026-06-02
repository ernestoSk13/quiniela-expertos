import { useEffect, useState, type JSX } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/Avatar'
import { resetAllData } from '@/services/firestoreAdmin'

// ── Nav data ───────────────────────────────────────────────────────────────────

const MOBILE_NAV = [
  { to: '/admin',            label: 'Jornadas', end: true },
  { to: '/admin/jugadores',  label: 'Jugadores' },
  { to: '/admin/usuarios',   label: 'Acceso' },
  { to: '/admin/tabla',      label: 'Tabla' },
]

const MORE_NAV = [
  { to: '/admin/bonus',           label: 'Bonus' },
  { to: '/admin/metricas',        label: 'Métricas' },
  { to: '/admin/notificaciones',  label: 'Notificaciones' },
  { to: '/admin/config',          label: 'Puntos' },
  { to: '/admin/premios',         label: 'Premios' },
]

const MORE_PATHS = MORE_NAV.map(n => n.to)

const SIDEBAR_SECTIONS = [
  {
    label: 'GESTIÓN',
    items: [
      { to: '/admin',           label: 'Jornadas',  end: true as const },
      { to: '/admin/jugadores', label: 'Jugadores' },
      { to: '/admin/usuarios',  label: 'Acceso' },
    ],
  },
  {
    label: 'REPORTES',
    items: [
      { to: '/admin/tabla',    label: 'Clasificación' },
      { to: '/admin/metricas', label: 'Métricas' },
      { to: '/admin/premios',  label: 'Premios' },
    ],
  },
  {
    label: 'CONFIG',
    items: [
      { to: '/admin/bonus',          label: 'Bonus' },
      { to: '/admin/notificaciones', label: 'Notificaciones' },
      { to: '/admin/config',         label: 'Puntos' },
    ],
  },
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

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M6 3h12v6a6 6 0 0 1-12 0V3z" />
      <path d="M12 15v4" />
      <path d="M8 19h8" />
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
  '/admin/premios':           <TrophyIcon />,
}

const MORE_ICONS: Record<string, JSX.Element> = {
  '/admin/bonus':          <StarIcon />,
  '/admin/metricas':       <ChartIcon />,
  '/admin/notificaciones': <BellIcon />,
  '/admin/config':         <GearIcon />,
  '/admin/premios':        <TrophyIcon />,
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [resetting, setResetting] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showDanger, setShowDanger] = useState(false)

  const isMoreActive = MORE_PATHS.some(p => location.pathname.startsWith(p))

  useEffect(() => {
    setShowMore(false)
    setShowDanger(false)
  }, [location.pathname])

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
    if (!confirmed) { setShowDanger(false); return }
    setResetting(true)
    try {
      await resetAllData()
    } finally {
      setResetting(false)
      setShowDanger(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen app-bg text-white">

        {/* ── Desktop sidebar ── */}
        <aside className="adm-sidebar hidden lg:flex flex-col fixed left-0 top-0 h-screen z-20">

          {/* Brand */}
          <div className="adm-sidebar-brand">
            <Avatar url={user?.avatarUrl ?? ''} name={user?.displayName || 'Admin'} size="sm" />
            <div>
              <div className="adm-sidebar-brand-sub">Quiniela Expertos</div>
              <div className="adm-sidebar-brand-title">ADMIN</div>
            </div>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 overflow-y-auto py-3">
            {SIDEBAR_SECTIONS.map(section => (
              <div key={section.label} className="adm-sidebar-section">
                <div className="adm-sidebar-section-header">{section.label}</div>
                {section.items.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `adm-sidebar-item ${isActive ? 'adm-sidebar-active' : ''}`
                    }
                  >
                    <span className="adm-sidebar-icon">{NAV_ICONS[to]}</span>
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="adm-sidebar-footer">
            <span className="adm-sidebar-email" title={user?.email}>{user?.email}</span>
            <button onClick={() => navigate('/')} className="adm-sidebar-btn-player">
              ← Ver como jugador
            </button>
            <button onClick={handleSignOut} className="adm-sidebar-btn-ghost">
              Salir
            </button>
            {showDanger ? (
              <button
                onClick={handleReset}
                disabled={resetting}
                className="adm-sidebar-btn-danger-confirm"
              >
                {resetting ? 'Restaurando...' : '⚠️ Confirmar restauración'}
              </button>
            ) : (
              <button onClick={() => setShowDanger(true)} className="adm-sidebar-btn-restore">
                Restaurar datos
              </button>
            )}
          </div>
        </aside>

        {/* ── Mobile header ── */}
        <header className="lg:hidden adm-header-mobile fixed top-0 left-0 right-0 z-10">
          <div className="px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar url={user?.avatarUrl ?? ''} name={user?.displayName || 'Admin'} size="sm" />
              <div className="adm-sidebar-brand-title" style={{ fontSize: '0.95rem' }}>ADMIN</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/')} className="adm-btn-player">Jugador</button>
              <button onClick={handleSignOut} className="adm-btn-ghost">Salir</button>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="lg:ml-56 px-4 py-6 pt-16 lg:pt-8 pb-28 lg:pb-10">
          <Outlet />
        </main>

        {/* ── "Más" panel (slide-up sobre tab bar) ── */}
        {showMore && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowMore(false)}
            />
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
          className="lg:hidden fixed bottom-0 left-0 right-0 flex adm-tabbar"
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
  /* ── Sidebar (desktop) ── */
  .adm-sidebar {
    width: 224px;
    background: #0D0F14;
    border-right: 1px solid rgba(255,255,255,0.06);
  }

  .adm-sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 16px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .adm-sidebar-brand-sub {
    font-size: 0.52rem;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.28);
    text-transform: uppercase;
    line-height: 1;
    margin-bottom: 3px;
  }
  .adm-sidebar-brand-title {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.12em;
    color: var(--accent-light);
    line-height: 1;
  }

  .adm-sidebar-section {
    padding: 0 8px;
    margin-bottom: 4px;
  }
  .adm-sidebar-section-header {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: rgba(255,255,255,0.22);
    text-transform: uppercase;
    padding: 10px 8px 4px;
  }
  .adm-sidebar-item {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 7px;
    font-size: 0.82rem;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    text-decoration: none;
    transition: color 0.15s ease, background 0.15s ease;
    border-left: 3px solid transparent;
    margin-bottom: 1px;
  }
  .adm-sidebar-item:hover {
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.05);
  }
  .adm-sidebar-active {
    color: var(--accent-light) !important;
    background: #1E2433 !important;
    border-left-color: var(--accent) !important;
  }
  .adm-sidebar-icon {
    opacity: 0.5;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .adm-sidebar-active .adm-sidebar-icon { opacity: 1; }

  .adm-sidebar-footer {
    padding: 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .adm-sidebar-email {
    font-size: 0.68rem;
    color: rgba(255,255,255,0.22);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 2px;
  }
  .adm-sidebar-btn-player {
    width: 100%;
    text-align: left;
    padding: 7px 10px;
    border-radius: 7px;
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    background: var(--accent-deep);
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .adm-sidebar-btn-player:hover {
    background: var(--accent-muted);
  }

  .adm-sidebar-btn-ghost {
    width: 100%;
    text-align: left;
    padding: 7px 10px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.42);
    background: transparent;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .adm-sidebar-btn-ghost:hover {
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
  }
  .adm-sidebar-btn-restore {
    width: 100%;
    text-align: left;
    padding: 6px 10px;
    border-radius: 7px;
    border: none;
    color: rgba(255,255,255,0.2);
    background: transparent;
    font-size: 0.72rem;
    cursor: pointer;
    transition: color 0.15s ease;
  }
  .adm-sidebar-btn-restore:hover { color: rgba(239,68,68,0.6); }
  .adm-sidebar-btn-danger-confirm {
    width: 100%;
    text-align: left;
    padding: 7px 10px;
    border-radius: 7px;
    border: 1px solid rgba(239,68,68,0.35);
    color: rgba(239,68,68,0.85);
    background: rgba(239,68,68,0.07);
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.15s ease;
    animation: adm-danger-in 0.15s ease;
  }
  .adm-sidebar-btn-danger-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
  @keyframes adm-danger-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Mobile header ── */
  .adm-header-mobile {
    background: var(--surface-nav);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  /* ── Shared button styles (mobile header) ── */
  .adm-btn-player {
    font-size: 0.7rem;
    padding: 4px 10px;
    border-radius: 7px;
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    background: var(--accent-deep);
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .adm-btn-player:hover { background: var(--accent-muted); }

  .adm-btn-ghost {
    font-size: 0.7rem;
    padding: 4px 10px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.32);
    background: transparent;
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .adm-btn-ghost:hover {
    color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
  }

  /* ── Tab bar (mobile) ── */
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

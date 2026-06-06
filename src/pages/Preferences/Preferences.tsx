import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { saveUserTimezone, updateUserProfile } from '@/services/firestoreUsers'
import { uploadAvatar } from '@/services/storageAvatars'
import Avatar from '@/components/Avatar'
import ThemeSelector from '@/components/ThemeSelector'

const PLATFORM_STEPS: Record<string, { icon: string; text: string }[]> = {
  ios: [
    { icon: '⬆️', text: 'Abre Safari y toca el botón Compartir (cuadro con flecha)' },
    { icon: '➕', text: 'Desplázate y selecciona "Añadir a pantalla de inicio"' },
    { icon: '✅', text: 'Toca "Añadir" para confirmar' },
  ],
  android: [
    { icon: '⋮', text: 'Toca el menú (tres puntos) en la esquina superior de Chrome' },
    { icon: '📲', text: 'Selecciona "Añadir a pantalla de inicio" o "Instalar app"' },
    { icon: '✅', text: 'Confirma tocando "Añadir" o "Instalar"' },
  ],
  chromium: [
    { icon: '⊕', text: 'Haz clic en el ícono de instalación (⊕) en la barra de direcciones' },
    { icon: '✅', text: 'Confirma haciendo clic en "Instalar"' },
  ],
  desktop: [
    { icon: '🌐', text: 'Abre la app en Chrome o Edge' },
    { icon: '⊕', text: 'Haz clic en el ícono de instalación en la barra de direcciones' },
    { icon: '✅', text: 'Confirma haciendo clic en "Instalar"' },
  ],
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.5 13H11L10 22L20.5 11H14L13 2Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ── Section header with gradient rule ─────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="text-[9px] font-bold tracking-[0.3em] uppercase whitespace-nowrap"
        style={{ color: 'rgba(255,255,255,0.28)' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{
          background: 'linear-gradient(to right, var(--accent), transparent)',
          opacity: 0.4,
        }}
      />
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const prefStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

  .pref-back {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.75rem 0.3rem 0.55rem;
    border-radius: 99px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.5);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
  }
  .pref-back:hover {
    border-color: var(--accent);
    color: var(--accent-light);
    background: var(--accent-deep);
  }

  .pref-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.38rem 0.72rem;
    border-radius: 99px;
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    box-shadow: 0 0 8px var(--accent-muted);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--accent-light);
  }

  .pref-install-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.875rem;
    border: none;
    background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%);
    box-shadow: 0 4px 18px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.12);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.1s ease;
  }
  .pref-install-btn:active { transform: scale(0.98); opacity: 0.9; }

  .pref-signout:hover {
    background: rgba(255,60,60,0.06);
  }

  .pref-select {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px 14px;
    color: white;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s ease;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }
  .pref-select:focus { border-color: var(--accent); }
  .pref-select option { background: #1a1d27; color: white; }

  .pref-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    color: white;
    font-size: 0.875rem;
    outline: none;
    padding: 0;
  }
  .pref-input::placeholder { color: rgba(255,255,255,0.2); }

  .pref-save-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.28rem 0.7rem;
    border-radius: 99px;
    border: 1px solid var(--accent-muted);
    background: var(--accent-deep);
    color: var(--accent-light);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .pref-save-btn:hover { background: var(--accent-muted); border-color: var(--accent); }
  .pref-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`

// ── Content (exported for inline use inside Dashboard tab) ─────────────────────

export function PreferencesContent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const push = usePushNotifications()
  const pwa = usePWAInstall()
  const steps = PLATFORM_STEPS[pwa.platform] ?? PLATFORM_STEPS.desktop

  // ── Profile editing ────────────────────────────────────────────────────────
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [nameValue, setNameValue] = useState(user?.displayName ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const avatarFileInputRef   = useRef<HTMLInputElement>(null)
  const avatarCameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.displayName != null) setNameValue(user.displayName)
  }, [user?.displayName])

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    setShowAvatarMenu(false)
    setAvatarUploading(true)
    try {
      const url = await uploadAvatar(user.displayName, file)
      await updateUserProfile(user.uid, { avatarUrl: url })
    } catch (err) {
      console.error('Error al subir avatar:', err)
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSaveName() {
    const trimmed = nameValue.trim()
    if (!user || !trimmed || trimmed === user.displayName) return
    setNameSaving(true)
    try {
      await updateUserProfile(user.uid, { displayName: trimmed })
    } catch (err) {
      console.error('Error al guardar nombre:', err)
    } finally {
      setNameSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <>
      <style>{prefStyles}</style>
      <div className="space-y-8">

        {/* ── Perfil ── */}
        {user && (
          <section>
            <SectionHeader label="Perfil" />
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Avatar row */}
              <div
                className="flex items-center gap-3 px-4 py-3 relative"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <button
                  onClick={() => setShowAvatarMenu(v => !v)}
                  className="relative group shrink-0 rounded-full focus:outline-none"
                >
                  {avatarUploading ? (
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="animate-spin text-[var(--accent-light)]">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                      </svg>
                    </div>
                  ) : (
                    <>
                      <Avatar url={user.avatarUrl ?? ''} name={user.displayName || '?'} size="md" />
                      <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </span>
                    </>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Foto de perfil</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>Toca para cambiar</p>
                </div>

                {/* Avatar dropdown */}
                {showAvatarMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowAvatarMenu(false)} />
                    <div
                      className="absolute right-4 top-12 z-30 rounded-xl overflow-hidden"
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        minWidth: 148,
                      }}
                    >
                      <button
                        onClick={() => { setShowAvatarMenu(false); avatarCameraInputRef.current?.click() }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                      >
                        <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        Tomar foto
                      </button>
                      <div className="h-px bg-white/5 mx-3" />
                      <button
                        onClick={() => { setShowAvatarMenu(false); avatarFileInputRef.current?.click() }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                      >
                        <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Galería
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Name row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                  <PersonIcon />
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)', width: 52, flexShrink: 0 }}>
                  Nombre
                </span>
                <input
                  className="pref-input"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  placeholder="Tu nombre"
                  maxLength={30}
                />
                {nameValue.trim() !== user.displayName && nameValue.trim().length > 0 && (
                  <button
                    className="pref-save-btn"
                    onClick={handleSaveName}
                    disabled={nameSaving}
                  >
                    {nameSaving ? '...' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>

            {/* Hidden file inputs */}
            <input ref={avatarCameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarFileChange} />
            <input ref={avatarFileInputRef}   type="file" accept="image/*"               className="hidden" onChange={handleAvatarFileChange} />
          </section>
        )}

        {/* ── Tema ── */}
        <section>
          <SectionHeader label="Tema" />
          <ThemeSelector />
        </section>

        {/* ── Zona horaria ── */}
        <section>
          <SectionHeader label="Zona horaria" />
          <div className="space-y-2">
            <select
              value={user?.timezone ?? ''}
              onChange={e => user && saveUserTimezone(user.uid, e.target.value)}
              className="pref-select"
            >
              <option value="">Detectar automáticamente</option>
              <option value="America/Mexico_City">Ciudad de México (UTC−6/−5)</option>
              <option value="America/Los_Angeles">Tijuana / Los Ángeles (UTC−8/−7)</option>
              <option value="America/Cancun">Cancún (UTC−5, sin cambio de horario)</option>
            </select>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', paddingLeft: 2 }}>
              {user?.timezone
                ? 'Los horarios de partidos y deadlines se muestran en esta zona.'
                : `Detectado: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}
            </p>
          </div>
        </section>

        {/* ── Instalar app ── */}
        <section>
          <SectionHeader label="Instalar app" />

          {pwa.isInstalled ? (
            /* Installed state */
            <div
              className="flex items-center gap-4 rounded-xl p-4"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: '2px solid var(--accent)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="18" cy="18" r="17" fill="var(--accent-muted)" stroke="var(--accent)" strokeWidth="1.2" />
                <path d="M11 18l4.5 4.5L25 13" stroke="var(--accent-light)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-white">App instalada</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Ya tienes Quiniela Expertos en tu pantalla de inicio.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Feature chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  { label: 'Acceso rápido',  Icon: LightningIcon },
                  { label: 'Notificaciones', Icon: BellIcon      },
                  { label: 'Sin navegador',  Icon: PhoneIcon     },
                ] as const).map(({ label, Icon }) => (
                  <div key={label} className="pref-chip">
                    <Icon />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Native install button */}
              {pwa.canPrompt && (
                <button onClick={pwa.install} className="pref-install-btn">
                  <DownloadIcon />
                  Instalar aplicación
                </button>
              )}

              {/* Manual instructions */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p
                  className="text-[9px] font-semibold tracking-[0.22em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.22)' }}
                >
                  {pwa.canPrompt ? 'O sigue estos pasos manualmente' : 'Cómo instalar'}
                </p>
                {steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                      style={{
                        background: 'var(--accent-muted)',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent-light)',
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: '0.7rem',
                        lineHeight: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* iOS note */}
              {pwa.platform === 'ios' && (
                <p className="text-[10px] text-center italic" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  En iPhone e iPad la instalación solo está disponible desde Safari.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Notificaciones ── */}
        <section>
          <SectionHeader label="Notificaciones" />

          {push.isSupported ? (
            <div
              className="flex items-center gap-4 rounded-xl p-4 transition-all duration-300"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: push.isEnabled ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Recordatorios de jornada</p>
                <p
                  className="text-xs mt-0.5 leading-relaxed"
                  style={{
                    color: push.permission === 'denied'
                      ? 'rgba(255,190,50,0.75)'
                      : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {push.permission === 'denied'
                    ? 'Bloqueadas en el navegador — actívalas desde Ajustes del sistema'
                    : 'Aviso antes del cierre y al publicar resultados'}
                </p>
              </div>

              {push.permission === 'denied' ? (
                /* Lock icon when blocked */
                <div style={{ color: 'rgba(255,190,50,0.6)', flexShrink: 0 }}>
                  <LockIcon />
                </div>
              ) : (
                /* Toggle switch */
                <button
                  onClick={push.toggle}
                  disabled={push.isLoading}
                  aria-label={push.isEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                  style={{
                    width: 50,
                    height: 28,
                    borderRadius: 14,
                    background: push.isEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    border: push.isEnabled ? '1px solid var(--accent-light)' : '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    flexShrink: 0,
                    cursor: push.isLoading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.25s ease, border-color 0.25s ease',
                    opacity: push.isLoading ? 0.5 : 1,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: push.isEnabled ? 25 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                      transition: 'left 0.25s cubic-bezier(.16,1,.3,1)',
                    }}
                  />
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Las notificaciones no están disponibles en este dispositivo o navegador.
            </p>
          )}
        </section>

        {/* ── Cuenta ── */}
        {user && (
          <section>
            <SectionHeader label="Cuenta" />
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Display name row */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                  <PersonIcon />
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)', width: 52, flexShrink: 0 }}>
                  Usuario
                </span>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="rounded-full shrink-0 object-cover"
                      style={{ width: 28, height: 28 }}
                    />
                  )}
                  <span className="text-sm text-white truncate">{user.displayName}</span>
                </div>
              </div>

              {/* Email row */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                  <MailIcon />
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)', width: 52, flexShrink: 0 }}>
                  Correo
                </span>
                <span className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {user.email}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="pref-signout w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              >
                <span style={{ color: 'rgba(255,80,80,0.6)', flexShrink: 0 }}>
                  <LogoutIcon />
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)', width: 52, flexShrink: 0 }}>
                  Sesión
                </span>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,80,80,0.75)' }}>
                  Cerrar sesión
                </span>
              </button>
            </div>
          </section>
        )}

      </div>
    </>
  )
}

// ── Full page (route /preferencias — desktop gear icon) ───────────────────────

export default function Preferences() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen app-bg text-white">

      {/* ── Header ── */}
      <header
        className="surface-nav sticky top-0 z-10"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="pref-back">
            <ChevronLeft />
            <span>Volver</span>
          </button>
          <h1
            style={{
              fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
              fontSize: '1.3rem',
              letterSpacing: '0.1em',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            PREFERENCIAS
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <PreferencesContent />
      </main>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { updateUserTheme } from '@/services/firestoreUsers'
import { THEMES } from '@/lib/themes'

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

export default function Preferences() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { themeId } = useTheme()
  const push = usePushNotifications()
  const pwa = usePWAInstall()

  const steps = PLATFORM_STEPS[pwa.platform] ?? PLATFORM_STEPS.desktop

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen app-bg text-white">

      {/* Header */}
      <header className="border-b border-gray-800 surface-nav sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors p-1 -ml-1 rounded-lg"
            aria-label="Volver"
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="font-bold text-white text-sm">Preferencias</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* ── Tema ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tema</h2>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => user && updateUserTheme(user.uid, t.id)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${
                  themeId === t.id
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent-light)]'
                    : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <span className="text-3xl">{t.flag}</span>
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Instalar app ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Instalar app
          </h2>

          {pwa.isInstalled ? (
            /* Ya instalada */
            <div className="surface-card border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-white">App instalada</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ya tienes Quiniela Expertos en tu pantalla de inicio.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Beneficios */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '⚡', label: 'Acceso rápido' },
                  { icon: '🔔', label: 'Notificaciones' },
                  { icon: '📱', label: 'Sin navegador' },
                ].map(({ icon, label }) => (
                  <div key={label} className="surface-card border border-gray-800 rounded-xl py-3 px-2">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {/* Botón nativo (Chrome/Edge/Android) */}
              {pwa.canPrompt && (
                <button
                  onClick={pwa.install}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  Instalar aplicación
                </button>
              )}

              {/* Instrucciones manuales */}
              <div className="surface-card border border-gray-800 rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  {pwa.canPrompt ? 'O sigue estos pasos manualmente' : 'Cómo instalar'}
                </p>
                {steps.map(({ icon, text }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5 shrink-0 w-6 text-center">{icon}</span>
                    <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* iOS: nota sobre Safari */}
              {pwa.platform === 'ios' && (
                <p className="text-xs text-gray-600 text-center px-2">
                  En iPhone e iPad la instalación solo está disponible desde Safari.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Notificaciones ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Notificaciones
          </h2>
          {push.isSupported ? (
            <div className="surface-card border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Recordatorios de jornada</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {push.permission === 'denied'
                    ? 'Bloqueadas en el navegador — actívalas desde Ajustes del sistema'
                    : 'Aviso antes del cierre y al publicar resultados'}
                </p>
              </div>
              <button
                onClick={push.toggle}
                disabled={push.isLoading || push.permission === 'denied'}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                  push.isEnabled ? 'bg-[var(--accent)]' : 'bg-gray-700'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  push.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Las notificaciones no están disponibles en este dispositivo o navegador.
            </p>
          )}
        </section>

        {/* ── Cuenta ───────────────────────────────────────────────── */}
        {user && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cuenta</h2>
            <div className="surface-card border border-gray-800 rounded-xl divide-y divide-gray-800/60 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-gray-500 w-20 shrink-0">Usuario</span>
                <span className="text-sm text-gray-300 truncate">{user.displayName}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs text-gray-500 w-20 shrink-0">Correo</span>
                <span className="text-sm text-gray-300 truncate">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-800/40 transition-colors"
              >
                <span className="text-xs text-gray-500 w-20 shrink-0">Sesión</span>
                <span className="text-sm text-red-400">Cerrar sesión</span>
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

interface Props {
  onDone: () => void
}

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

const INSTRUCTIONS = {
  ios: [
    { icon: '⬆️', text: 'Toca el botón Compartir en Safari' },
    { icon: '➕', text: 'Selecciona "Añadir a pantalla de inicio"' },
    { icon: '✅', text: 'Toca "Añadir" para confirmar' },
  ],
  android: [
    { icon: '⋮', text: 'Toca el menú en Chrome' },
    { icon: '📲', text: 'Selecciona "Agregar a pantalla de inicio"' },
    { icon: '✅', text: 'Confirma tocando "Agregar"' },
  ],
  desktop: [
    { icon: '➕', text: 'Haz clic en el ícono de instalación en la barra de direcciones' },
    { icon: '✅', text: 'Confirma haciendo clic en "Instalar"' },
  ],
}

export default function StepInstall({ onDone }: Props) {
  const platform = detectPlatform()
  const steps = INSTRUCTIONS[platform]

  return (
    <div className="space-y-6">
      {/* Ícono y título */}
      <div className="text-center space-y-3">
        <div className="text-5xl">📲</div>
        <h2 className="text-xl font-bold text-white">Instala la app</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Agrégala a tu pantalla de inicio para acceder más rápido,
          recibir notificaciones y tener la experiencia completa.
        </p>
      </div>

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

      {/* Instrucciones del dispositivo */}
      <div className="surface-card border border-gray-800 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
          Cómo instalar
        </p>
        {steps.map(({ icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5 shrink-0 w-6 text-center">{icon}</span>
            <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="space-y-3">
        <button
          onClick={onDone}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Entendido, ya la instalé
        </button>
        <button
          onClick={onDone}
          className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  )
}

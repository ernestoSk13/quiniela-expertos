import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvite } from '@/services/cloudFunctions'

type State = 'loading' | 'ready' | 'expired' | 'invalid'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<State>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    getInvite(token)
      .then(({ email: e }) => { setEmail(e); setState('ready') })
      .catch(err => {
        const code = err?.code ?? ''
        setState(code.includes('deadline-exceeded') ? 'expired' : 'invalid')
      })
  }, [token])

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-4">
      <div className="surface-card border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-5">

        {state === 'loading' && (
          <p className="text-gray-400 text-sm">Validando invitación...</p>
        )}

        {state === 'ready' && (
          <>
            <div className="text-4xl">⚽</div>
            <h1 className="text-xl font-bold text-white">¡Estás invitado!</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Fuiste invitado a unirte a{' '}
              <span className="text-[var(--accent-light)] font-medium">Quiniela Expertos del Mundial 2026</span>.
            </p>
            {email && (
              <p className="text-xs text-gray-500">
                Tu correo: <span className="text-gray-300">{email}</span>
              </p>
            )}
            <Link
              to={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="block w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Crear cuenta / Iniciar sesión
            </Link>
          </>
        )}

        {state === 'expired' && (
          <>
            <div className="text-4xl">⏰</div>
            <h1 className="text-xl font-bold text-white">Invitación expirada</h1>
            <p className="text-gray-400 text-sm">
              Este link ya no es válido. Pide al administrador que genere uno nuevo.
            </p>
          </>
        )}

        {state === 'invalid' && (
          <>
            <div className="text-4xl">🚫</div>
            <h1 className="text-xl font-bold text-white">Link no válido</h1>
            <p className="text-gray-400 text-sm">
              Este link de invitación no existe o ya fue revocado.
            </p>
          </>
        )}

      </div>
    </div>
  )
}

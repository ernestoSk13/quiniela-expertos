import { type FormEvent, useEffect, useState } from 'react'
import {
  addAllowedUser,
  getAllowedUsers,
  removeAllowedUser,
} from '@/services/firestoreAllowedUsers'
import { generateInviteLink } from '@/services/firestoreInvites'

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path
        fillRule="evenodd"
        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function AllowedUsers() {
  const [emails, setEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  useEffect(() => {
    getAllowedUsers()
      .then(list => setEmails(list.sort()))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const normalized = newEmail.toLowerCase().trim()
    if (!normalized) return
    if (emails.includes(normalized)) {
      setError('Este correo ya está en la lista.')
      return
    }
    setAdding(true)
    try {
      await addAllowedUser(normalized)
      setEmails(prev => [...prev, normalized].sort())
      setNewEmail('')
    } catch {
      setError('Error al agregar el correo.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(email: string) {
    if (!confirm(`¿Quitar acceso a ${email}?`)) return
    await removeAllowedUser(email)
    setEmails(prev => prev.filter(e => e !== email))
  }

  async function handleCopyLink(email: string) {
    try {
      const link = await generateInviteLink(email)
      await navigator.clipboard.writeText(link)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2500)
    } catch {
      // fallback: show the link in a prompt
      const link = await generateInviteLink(email)
      window.prompt('Copia el link de invitación:', link)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Usuarios con acceso</h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
          className="flex-1 bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm transition-colors"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2.5 text-sm rounded-xl bg-[var(--accent-hover)] hover:bg-[var(--accent)] disabled:opacity-50 font-medium transition-colors shrink-0"
        >
          {adding ? '...' : 'Agregar'}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* List */}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : emails.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin usuarios registrados.</p>
      ) : (
        <div className="space-y-1">
          {emails.map(email => (
            <div
              key={email}
              className="flex items-center justify-between surface-card border border-gray-800 rounded-xl px-4 py-3 gap-2"
            >
              <span className="text-sm text-gray-200 truncate min-w-0">{email}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyLink(email)}
                  title="Copiar link de invitación"
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${
                    copiedEmail === email
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-gray-500 hover:text-[var(--accent-light)] hover:bg-[var(--accent-dim)]'
                  }`}
                >
                  <LinkIcon />
                  <span className="hidden sm:inline">
                    {copiedEmail === email ? 'Copiado' : 'Invitar'}
                  </span>
                </button>
                <button
                  onClick={() => handleRemove(email)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-sm"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4">
        "Invitar" genera un link válido por 7 días que puedes enviarle directamente.
      </p>
    </div>
  )
}

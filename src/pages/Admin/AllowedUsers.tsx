import { type FormEvent, useEffect, useState } from 'react'
import {
  addAllowedUser,
  getAllowedUsers,
  removeAllowedUser,
} from '@/services/firestoreAllowedUsers'

export default function AllowedUsers() {
  const [emails, setEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
              className="flex items-center justify-between surface-card border border-gray-800 rounded-xl px-4 py-3"
            >
              <span className="text-sm text-gray-200">{email}</span>
              <button
                onClick={() => handleRemove(email)}
                className="text-gray-600 hover:text-red-400 transition-colors text-sm ml-4"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

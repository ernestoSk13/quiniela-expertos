import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/Avatar'
import { getAllUsers, adminUpdateUser } from '@/services/firestoreUsers'
import { getPredictionCountsByUser } from '@/services/firestorePredictions'
import { uploadAvatar } from '@/services/storageAvatars'
import type { User, UserRole } from '@/types'

interface EditState {
  displayName: string
  role: UserRole
  avatarFile: File | null
  previewUrl: string
  saving: boolean
}

function initEdit(user: User): EditState {
  return {
    displayName: user.displayName,
    role: user.role,
    avatarFile: null,
    previewUrl: user.avatarUrl,
    saving: false,
  }
}

export default function UserProfiles() {
  const [users, setUsers] = useState<User[]>([])
  const [predCounts, setPredCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      getAllUsers(),
      getPredictionCountsByUser(),
    ]).then(([list, counts]) => {
      setUsers(list.sort((a, b) => a.displayName.localeCompare(b.displayName)))
      setPredCounts(counts)
    }).finally(() => setLoading(false))
  }, [])

  function startEdit(user: User) {
    setEditingUid(user.uid)
    setEdit(initEdit(user))
  }

  function cancelEdit() {
    setEditingUid(null)
    setEdit(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !edit) return
    setEdit({ ...edit, avatarFile: file, previewUrl: URL.createObjectURL(file) })
  }

  async function handleSave(user: User) {
    if (!edit) return
    setEdit(e => e && { ...e, saving: true })
    try {
      let avatarUrl = edit.previewUrl
      if (edit.avatarFile) {
        avatarUrl = await uploadAvatar(edit.displayName, edit.avatarFile)
      }
      await adminUpdateUser(user.uid, {
        displayName: edit.displayName.trim(),
        avatarUrl,
        role: edit.role,
      })
      setUsers(prev =>
        prev
          .map(u =>
            u.uid === user.uid
              ? { ...u, displayName: edit.displayName.trim(), avatarUrl, role: edit.role }
              : u,
          )
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      )
      setEditingUid(null)
      setEdit(null)
    } catch (err) {
      console.error('Error al guardar usuario:', err)
      setEdit(e => e && { ...e, saving: false })
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Cargando...</p>
  if (users.length === 0)
    return <p className="text-gray-500 text-sm">Sin jugadores registrados.</p>

  const onboardingDone = users.filter(u => u.onboardingCompleted).length
  const totalPreds = Object.values(predCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Jugadores</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            <span className="text-white font-semibold">{onboardingDone}</span>
            /{users.length} onboarding
          </span>
          <span>
            <span className="text-white font-semibold">{totalPreds}</span> pronósticos
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 pb-2 text-xs text-gray-500 uppercase tracking-wide">
        <span>Jugador</span>
        <span className="text-center">Onboarding</span>
        <span className="text-center">Pronósticos</span>
        <span />
      </div>

      <div className="space-y-2">
        {users.map(user => {
          const isEditing = editingUid === user.uid
          const preds = predCounts[user.uid] ?? 0

          return (
            <div
              key={user.uid}
              className="surface-card border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-4 py-3">

                {/* Player info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    url={isEditing ? (edit?.previewUrl ?? '') : user.avatarUrl}
                    name={isEditing ? (edit?.displayName || '?') : (user.displayName || '?')}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">
                        {user.displayName || <span className="text-gray-500 italic">sin nombre</span>}
                      </p>
                      {user.role === 'admin' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent-dim)] text-[var(--accent-light)] shrink-0">
                          admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Onboarding status */}
                <div className="flex justify-center">
                  {user.onboardingCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-light)]">
                      ✓ Listo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                      ⏳ Pendiente
                    </span>
                  )}
                </div>

                {/* Prediction count */}
                <div className="flex justify-center">
                  <span className={`text-sm font-semibold tabular-nums ${preds > 0 ? 'text-white' : 'text-gray-600'}`}>
                    {preds}
                  </span>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => (isEditing ? cancelEdit() : startEdit(user))}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {/* Inline edit form */}
              {isEditing && edit && (
                <div className="border-t border-gray-800 px-4 py-4 space-y-4 bg-gray-950">
                  <div className="flex items-center gap-4">
                    <Avatar url={edit.previewUrl} name={edit.displayName || '?'} size="lg" />
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-[var(--accent-light)] transition-colors"
                      >
                        {edit.previewUrl ? 'Cambiar foto' : 'Subir foto'}
                      </button>
                      {edit.avatarFile && (
                        <p className="text-xs text-gray-500 mt-0.5">{edit.avatarFile.name}</p>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={edit.displayName}
                      onChange={e => setEdit({ ...edit, displayName: e.target.value })}
                      maxLength={30}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white placeholder-gray-600 rounded-xl px-3 py-2 text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Rol</label>
                    <select
                      value={edit.role}
                      onChange={e => setEdit({ ...edit, role: e.target.value as UserRole })}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-[var(--accent)] focus:outline-none text-white rounded-xl px-3 py-2 text-sm transition-colors"
                    >
                      <option value="player">player</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={edit.saving}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(user)}
                      disabled={!edit.displayName.trim() || edit.saving}
                      className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                    >
                      {edit.saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/Avatar'
import { getAllUsers, adminUpdateUser } from '@/services/firestoreUsers'
import { getPredictionCountsByUser } from '@/services/firestorePredictions'
import { uploadAvatar } from '@/services/storageAvatars'
import type { User, UserRole } from '@/types'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

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

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonPlayer() {
  return (
    <div className="up-shimmer" style={{ height: 64, borderRadius: 12 }} />
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

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

  const onboardingDone = users.filter(u => u.onboardingCompleted).length
  const totalPreds = Object.values(predCounts).reduce((a, b) => a + b, 0)

  return (
    <>
      <style>{styles}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24, maxWidth: 680 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
            JUGADORES
          </h1>
          {!loading && (
            <>
              <span style={{
                background: 'var(--accent-deep)', border: '1px solid var(--accent-muted)',
                borderRadius: 99, padding: '2px 8px', fontSize: '0.65rem',
                letterSpacing: '0.12em', color: 'var(--accent-light)',
              }}>
                {users.length} registrados
              </span>
              <span style={{
                background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 99, padding: '2px 8px', fontSize: '0.65rem',
                letterSpacing: '0.12em', color: 'rgba(74,222,128,0.8)',
              }}>
                {onboardingDone}/{users.length} onboarding
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 99, padding: '2px 8px', fontSize: '0.65rem',
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)',
              }}>
                {totalPreds} pronósticos
              </span>
            </>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Edita nombres, avatares y roles de los jugadores.
        </p>
      </div>

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading
          ? [1, 2, 3, 4, 5].map(i => <SkeletonPlayer key={i} />)
          : users.map(user => {
            const isEditing = editingUid === user.uid
            const preds = predCounts[user.uid] ?? 0

            return (
              <div
                key={user.uid}
                className="up-card rounded-xl overflow-hidden"
              >
                {/* Player row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>

                  {/* Avatar + info */}
                  <Avatar
                    url={isEditing ? (edit?.previewUrl ?? '') : user.avatarUrl}
                    name={isEditing ? (edit?.displayName || '?') : (user.displayName || '?')}
                    size="md"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.displayName || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>sin nombre</span>}
                      </span>
                      {user.role === 'admin' && (
                        <span style={{
                          fontSize: '0.6rem', padding: '2px 7px', borderRadius: 99,
                          background: 'var(--accent-deep)', border: '1px solid var(--accent-muted)',
                          color: 'var(--accent-light)', letterSpacing: '0.08em', flexShrink: 0,
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {user.email}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {user.onboardingCompleted ? (
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                        color: 'rgba(74,222,128,0.8)', letterSpacing: '0.06em',
                      }}>
                        ✓ OK
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.2)',
                        color: 'rgba(250,204,21,0.7)', letterSpacing: '0.06em',
                      }}>
                        ⏳
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700, minWidth: 28, textAlign: 'right',
                      color: preds > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                    }}>
                      {preds}
                    </span>
                    <button
                      onClick={() => (isEditing ? cancelEdit() : startEdit(user))}
                      className="up-edit-btn"
                    >
                      {isEditing ? 'Cerrar' : 'Editar'}
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && edit && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', gap: 14,
                  }}>
                    {/* Avatar upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Avatar url={edit.previewUrl} name={edit.displayName || '?'} size="lg" />
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            fontSize: '0.78rem', color: 'var(--accent-light)', background: 'none',
                            border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.15s',
                          }}
                        >
                          {edit.previewUrl ? 'Cambiar foto' : 'Subir foto'}
                        </button>
                        {edit.avatarFile && (
                          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                            {edit.avatarFile.name}
                          </p>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={edit.displayName}
                        onChange={e => setEdit({ ...edit, displayName: e.target.value })}
                        maxLength={30}
                        className="up-input w-full"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Rol
                      </label>
                      <select
                        value={edit.role}
                        onChange={e => setEdit({ ...edit, role: e.target.value as UserRole })}
                        className="up-select w-full"
                      >
                        <option value="player">player</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={edit.saving}
                        className="up-btn-secondary flex-1 py-2 rounded-xl text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(user)}
                        disabled={!edit.displayName.trim() || edit.saving}
                        className="up-btn-primary flex-1 py-2 rounded-xl text-sm"
                      >
                        {edit.saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        }
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes up-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .up-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 800px 100%;
    animation: up-shimmer 1.6s ease-in-out infinite;
  }

  .up-card {
    background: var(--surface-card);
    border: 1px solid rgba(255,255,255,0.05);
    transition: border-color 0.15s ease;
  }
  .up-card:hover { border-color: rgba(255,255,255,0.09); }

  .up-edit-btn {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.28);
    background: none;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 7px;
    padding: 3px 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .up-edit-btn:hover {
    color: rgba(255,255,255,0.7);
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
  }

  .up-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 9px 12px;
    color: white;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }
  .up-input::placeholder { color: rgba(255,255,255,0.2); }
  .up-input:focus { border-color: var(--accent); }

  .up-select {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 9px 12px;
    color: white;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }
  .up-select:focus { border-color: var(--accent); }

  .up-btn-primary {
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .up-btn-primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .up-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .up-btn-secondary {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .up-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: white; }
  .up-btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
`

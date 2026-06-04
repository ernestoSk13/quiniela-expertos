import { type FormEvent, useEffect, useState } from 'react'
import {
  addAllowedUser,
  getAllowedUsers,
  removeAllowedUser,
} from '@/services/firestoreAllowedUsers'
import { generateInviteLink } from '@/services/firestoreInvites'
import { getAllUsers } from '@/services/firestoreUsers'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

// ── Icons ──────────────────────────────────────────────────────────────────────

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
      <path
        fillRule="evenodd"
        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AllowedUsers() {
  const [emails, setEmails] = useState<string[]>([])
  const [pendingEmails, setPendingEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAllowedUsers(), getAllUsers()]).then(([allowedList, users]) => {
      const sorted = allowedList.sort()
      setEmails(sorted)
      // Emails in allowedUsers that have no completed onboarding
      const completedEmails = new Set(
        users.filter(u => u.onboardingCompleted).map(u => u.email.toLowerCase()),
      )
      setPendingEmails(sorted.filter(e => !completedEmails.has(e)))
    }).finally(() => setLoading(false))
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
      const link = await generateInviteLink(email)
      window.prompt('Copia el link de invitación:', link)
    }
  }

  return (
    <>
      <style>{styles}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
            ACCESO
          </h1>
          {!loading && (
            <span style={{
              background: 'var(--accent-deep)',
              border: '1px solid var(--accent-muted)',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              color: 'var(--accent-light)',
            }}>
              {emails.length} usuarios
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Correos autorizados. Genera links de invitación válidos por 7 días.
        </p>
      </div>

      <div style={{ maxWidth: 520 }}>

        {/* Pending onboarding banner */}
        {!loading && pendingEmails.length > 0 && (
          <div style={{
            background: 'rgba(250,204,21,0.06)',
            border: '1px solid rgba(250,204,21,0.2)',
            borderLeft: '3px solid rgba(250,204,21,0.5)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ color: 'rgba(250,204,21,0.7)', flexShrink: 0 }}>
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,204,21,0.75)' }}>
                Pendientes de onboarding
              </span>
              <span style={{
                background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)',
                borderRadius: 99, padding: '1px 7px', fontSize: '0.62rem',
                color: 'rgba(250,204,21,0.7)', letterSpacing: '0.08em',
              }}>
                {pendingEmails.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pendingEmails.map(email => (
                <div key={email} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                  }}>
                    {email}
                  </span>
                  <button
                    onClick={() => handleCopyLink(email)}
                    className={`au-link-btn ${copiedEmail === email ? 'au-link-copied' : ''}`}
                    style={{ flexShrink: 0 }}
                  >
                    {copiedEmail === email ? <CheckIcon /> : <LinkIcon />}
                    <span>{copiedEmail === email ? 'Copiado' : 'Invitar'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            className="au-input flex-1"
          />
          <button
            type="submit"
            disabled={adding}
            className="au-btn-primary px-4 py-2.5 rounded-xl text-sm"
          >
            {adding ? '···' : 'Agregar'}
          </button>
        </form>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 16,
          }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(239,68,68,0.8)' }}>{error}</span>
          </div>
        )}

        {/* Email list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="au-shimmer" style={{ height: 48, borderRadius: 12 }} />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '32px 0' }}>
            Sin usuarios registrados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {emails.map(email => (
              <div key={email} className="au-row rounded-xl">
                <span style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.65)',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {email}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleCopyLink(email)}
                    title="Copiar link de invitación"
                    className={`au-link-btn ${copiedEmail === email ? 'au-link-copied' : ''}`}
                  >
                    {copiedEmail === email ? <CheckIcon /> : <LinkIcon />}
                    <span className="hidden sm:inline">
                      {copiedEmail === email ? 'Copiado' : 'Invitar'}
                    </span>
                  </button>
                  <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
                  <button
                    onClick={() => handleRemove(email)}
                    className="au-remove-btn"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', marginTop: 16, letterSpacing: '0.02em' }}>
          El link de invitación expira en 7 días y es de un solo uso.
        </p>
      </div>
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  @keyframes au-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .au-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.07) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 800px 100%;
    animation: au-shimmer 1.6s ease-in-out infinite;
  }

  .au-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 10px 14px;
    color: white;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .au-input::placeholder { color: rgba(255,255,255,0.2); }
  .au-input:focus { border-color: var(--accent); }

  .au-btn-primary {
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .au-btn-primary:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .au-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .au-row {
    display: flex;
    align-items: center;
    gap: 10;
    background: var(--surface-card);
    border: 1px solid rgba(255,255,255,0.05);
    padding: 10px 14px;
    transition: border-color 0.15s ease;
    gap: 10px;
  }
  .au-row:hover { border-color: rgba(255,255,255,0.09); }

  .au-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.72rem;
    padding: 4px 8px;
    border-radius: 7px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .au-link-btn:hover {
    color: var(--accent-light);
    border-color: var(--accent-muted);
    background: var(--accent-deep);
  }
  .au-link-copied {
    color: #4ade80 !important;
    border-color: rgba(74,222,128,0.3) !important;
    background: rgba(74,222,128,0.07) !important;
  }

  .au-remove-btn {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.22);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;
    padding: 2px 4px;
  }
  .au-remove-btn:hover { color: rgba(239,68,68,0.7); }
`

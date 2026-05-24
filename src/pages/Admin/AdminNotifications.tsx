import { useEffect, useRef, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sendMassNotification } from '@/services/cloudFunctions'

// ── Templates ──────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    label: '📅 Jornada abierta',
    title: '¡Nueva jornada disponible!',
    body: 'Ya puedes enviar tus pronósticos. ¡No te quedes sin participar!',
  },
  {
    label: '⏰ Cierre próximo',
    title: '⏰ ¡Cierre en pocas horas!',
    body: 'La jornada cierra pronto. Completa tus pronósticos antes de que sea tarde.',
  },
  {
    label: '🏆 Resultados listos',
    title: '🏆 Resultados disponibles',
    body: 'Los resultados ya están publicados. ¡Entra a ver cuántos puntos ganaste!',
  },
  {
    label: '✏️ Personalizado',
    title: '',
    body: '',
  },
]

const TITLE_MAX = 50
const BODY_MAX  = 150

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminNotifications() {
  const [pushCount, setPushCount]       = useState<number | null>(null)
  const [title, setTitle]               = useState('')
  const [body, setBody]                 = useState('')
  const [templateIdx, setTemplateIdx]   = useState(0)
  const [confirming, setConfirming]     = useState(false)
  const [sending, setSending]           = useState(false)
  const [result, setResult]             = useState<{ sent: number } | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Cuenta usuarios con fcmToken
  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      const count = snap.docs.filter(d => !!d.data().fcmToken).length
      setPushCount(count)
    })
  }, [])

  function applyTemplate(idx: number) {
    setTemplateIdx(idx)
    setTitle(TEMPLATES[idx].title)
    setBody(TEMPLATES[idx].body)
    setConfirming(false)
    setResult(null)
    setError(null)
    if (idx === TEMPLATES.length - 1) {
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }

  function handleTitleChange(v: string) {
    setTitle(v.slice(0, TITLE_MAX))
    setConfirming(false)
  }
  function handleBodyChange(v: string) {
    setBody(v.slice(0, BODY_MAX))
    setConfirming(false)
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    setError(null)
    try {
      const res = await sendMassNotification(title.trim(), body.trim())
      setResult(res)
      setConfirming(false)
    } catch (e) {
      setError((e as Error).message ?? 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <style>{styles}</style>

      {/* ── Header ── */}
      <div className="notif-header">
        <div>
          <div className="notif-title">NOTIFICACIONES</div>
          <div className="notif-subtitle">Envía un push a todos los jugadores</div>
        </div>
        {pushCount !== null && (
          <div className="notif-count-badge">
            <span className="notif-count-num">{pushCount}</span>
            <span className="notif-count-label">con push activo</span>
          </div>
        )}
      </div>

      <div className="notif-layout">

        {/* ── Left: compose ── */}
        <div className="notif-compose">

          {/* Templates */}
          <div className="notif-section-label">PLANTILLA</div>
          <div className="notif-templates">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                className={`notif-tpl-btn ${templateIdx === i ? 'notif-tpl-active' : ''}`}
                onClick={() => applyTemplate(i)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="notif-section-label" style={{ marginTop: 20 }}>
            TÍTULO
            <span className="notif-char-count">{title.length}/{TITLE_MAX}</span>
          </div>
          <input
            ref={titleRef}
            className="notif-input"
            placeholder="Ej: ¡Nueva jornada disponible!"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            maxLength={TITLE_MAX}
          />

          {/* Body */}
          <div className="notif-section-label" style={{ marginTop: 16 }}>
            MENSAJE
            <span className="notif-char-count">{body.length}/{BODY_MAX}</span>
          </div>
          <textarea
            className="notif-textarea"
            placeholder="Ej: Ya puedes enviar tus pronósticos..."
            value={body}
            onChange={e => handleBodyChange(e.target.value)}
            maxLength={BODY_MAX}
            rows={3}
          />

          {/* Result banner */}
          {result && (
            <div className="notif-result-banner">
              <span style={{ fontSize: '1.1rem' }}>✅</span>
              <div>
                <div className="notif-result-title">
                  Enviada a {result.sent} jugador{result.sent !== 1 ? 'es' : ''}
                </div>
                <div className="notif-result-sub">
                  Solo llega a quienes tienen notificaciones activadas
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="notif-error-banner">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Confirm step */}
          {confirming && !result && (
            <div className="notif-confirm-box">
              <div className="notif-confirm-text">
                ¿Enviar a <strong>{pushCount ?? '?'}</strong> jugador{(pushCount ?? 0) !== 1 ? 'es' : ''}?
                Esta acción no se puede deshacer.
              </div>
              <div className="notif-confirm-actions">
                <button
                  className="notif-btn-ghost"
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </button>
                <button
                  className="notif-btn-send"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? 'Enviando…' : 'Confirmar y enviar'}
                </button>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          {!confirming && !result && (
            <button
              className="notif-btn-primary"
              disabled={!canSend}
              onClick={() => setConfirming(true)}
            >
              <BellIcon />
              Enviar notificación
            </button>
          )}

          {result && (
            <button
              className="notif-btn-ghost"
              onClick={() => { setResult(null); setTitle(''); setBody(''); setTemplateIdx(0) }}
            >
              Nueva notificación
            </button>
          )}
        </div>

        {/* ── Right: preview ── */}
        <div className="notif-preview-col">
          <div className="notif-section-label">VISTA PREVIA</div>
          <div className="notif-phone-wrap">
            <div className="notif-phone">
              {/* Status bar */}
              <div className="notif-phone-status">
                <span>9:41</span>
                <span>▶ ◉</span>
              </div>
              {/* Notification card */}
              <div className="notif-card">
                <div className="notif-card-header">
                  <div className="notif-card-app-icon">⚽</div>
                  <div className="notif-card-app-name">Quiniela Expertos</div>
                  <div className="notif-card-time">ahora</div>
                </div>
                <div className="notif-card-title">
                  {title || <span className="notif-placeholder">Título de la notificación</span>}
                </div>
                <div className="notif-card-body">
                  {body || <span className="notif-placeholder">Cuerpo del mensaje aquí…</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  .notif-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
  }
  .notif-title {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1.7rem;
    letter-spacing: 0.08em;
    color: #ffffff;
    line-height: 1;
  }
  .notif-subtitle {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.28);
    margin-top: 4px;
    letter-spacing: 0.04em;
  }
  .notif-count-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    border-radius: 10px;
    padding: 8px 14px;
  }
  .notif-count-num {
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1.6rem;
    letter-spacing: 0.06em;
    color: var(--accent-light);
    line-height: 1;
  }
  .notif-count-label {
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }

  /* ── Layout ── */
  .notif-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 28px;
  }
  @media (min-width: 768px) {
    .notif-layout {
      grid-template-columns: 1fr 280px;
      align-items: start;
    }
  }

  /* ── Compose ── */
  .notif-section-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 8px;
  }
  .notif-char-count {
    font-size: 0.62rem;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.04em;
    font-family: system-ui, sans-serif;
    text-transform: none;
  }

  /* Templates */
  .notif-templates {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .notif-tpl-btn {
    font-size: 0.75rem;
    padding: 5px 11px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.45);
    background: transparent;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }
  .notif-tpl-btn:hover {
    color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
  }
  .notif-tpl-active {
    color: var(--accent-light) !important;
    border-color: var(--accent-muted) !important;
    background: var(--accent-deep) !important;
  }

  /* Inputs */
  .notif-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.85rem;
    color: #ffffff;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .notif-input:focus {
    border-color: var(--accent-muted);
    background: var(--accent-deep);
  }
  .notif-input::placeholder { color: rgba(255,255,255,0.2); }

  .notif-textarea {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.85rem;
    color: #ffffff;
    outline: none;
    box-sizing: border-box;
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.15s ease;
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.5;
  }
  .notif-textarea:focus {
    border-color: var(--accent-muted);
    background: var(--accent-deep);
  }
  .notif-textarea::placeholder { color: rgba(255,255,255,0.2); }

  /* Banners */
  .notif-result-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.25);
    border-radius: 10px;
    padding: 12px 14px;
    margin-top: 16px;
  }
  .notif-result-title {
    font-size: 0.83rem;
    font-weight: 600;
    color: rgba(74,222,128,0.9);
  }
  .notif-result-sub {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }
  .notif-error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(239,68,68,0.07);
    border: 1px solid rgba(239,68,68,0.22);
    border-radius: 10px;
    padding: 10px 14px;
    margin-top: 14px;
    font-size: 0.8rem;
    color: rgba(239,68,68,0.85);
  }

  /* Confirm box */
  .notif-confirm-box {
    background: rgba(250,204,21,0.05);
    border: 1px solid rgba(250,204,21,0.2);
    border-radius: 10px;
    padding: 14px 16px;
    margin-top: 16px;
  }
  .notif-confirm-text {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.65);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .notif-confirm-text strong { color: rgba(250,204,21,0.9); }
  .notif-confirm-actions {
    display: flex;
    gap: 8px;
  }

  /* Buttons */
  .notif-btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    margin-top: 18px;
    padding: 11px 20px;
    border-radius: 10px;
    border: none;
    font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    color: #000;
    transition: opacity 0.15s ease;
  }
  .notif-btn-primary:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .notif-btn-primary:hover:not(:disabled) { opacity: 0.88; }

  .notif-btn-send {
    flex: 1;
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    color: #000;
    transition: opacity 0.15s ease;
  }
  .notif-btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
  .notif-btn-send:hover:not(:disabled) { opacity: 0.85; }

  .notif-btn-ghost {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 0.78rem;
    color: rgba(255,255,255,0.4);
    background: transparent;
    cursor: pointer;
    transition: all 0.12s ease;
    margin-top: 10px;
    width: 100%;
  }
  .notif-btn-ghost:hover {
    color: rgba(255,255,255,0.75);
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.04);
  }

  /* ── Phone preview ── */
  .notif-preview-col { }
  .notif-phone-wrap {
    display: flex;
    justify-content: center;
  }
  .notif-phone {
    width: 240px;
    background: #1c1c1e;
    border-radius: 28px;
    padding: 16px 12px 20px;
    border: 2px solid rgba(255,255,255,0.1);
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  }
  .notif-phone-status {
    display: flex;
    justify-content: space-between;
    padding: 0 6px 10px;
    font-size: 0.58rem;
    color: rgba(255,255,255,0.4);
    font-family: system-ui, sans-serif;
  }
  .notif-card {
    background: rgba(44,44,46,0.95);
    border-radius: 14px;
    padding: 11px 13px;
  }
  .notif-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .notif-card-app-icon {
    font-size: 0.75rem;
    width: 18px;
    height: 18px;
    background: rgba(255,255,255,0.08);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .notif-card-app-name {
    font-size: 0.6rem;
    color: rgba(255,255,255,0.4);
    font-family: system-ui, sans-serif;
    flex: 1;
    letter-spacing: 0.02em;
  }
  .notif-card-time {
    font-size: 0.58rem;
    color: rgba(255,255,255,0.25);
    font-family: system-ui, sans-serif;
  }
  .notif-card-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #ffffff;
    font-family: system-ui, sans-serif;
    line-height: 1.3;
    margin-bottom: 3px;
    word-break: break-word;
  }
  .notif-card-body {
    font-size: 0.68rem;
    color: rgba(255,255,255,0.55);
    font-family: system-ui, sans-serif;
    line-height: 1.4;
    word-break: break-word;
  }
  .notif-placeholder {
    color: rgba(255,255,255,0.18);
    font-style: italic;
  }
`

import { useState, useEffect, useRef } from 'react'
import { getAllUsers } from '@/services/firestoreUsers'
import { captureAndShare } from '@/hooks/useShareImage'
import PaniniCard, { ACCENT_OPTIONS, type AccentId } from './PaniniCard'
import type { User } from '@/types'

const BEBAS = "'Bebas Neue', Impact, 'Arial Narrow', sans-serif"

export default function AdminPremios() {
  const [players, setPlayers] = useState<User[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [selectedUid, setSelectedUid] = useState('')
  const [title, setTitle] = useState('MVP del Torneo')
  const [showPoints, setShowPoints] = useState(true)
  const [showPosition, setShowPosition] = useState(true)
  const [accentId, setAccentId] = useState<AccentId>('gold')
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllUsers().then(users => {
      const eligible = users
        .filter(u => u.onboardingCompleted && u.role !== 'observer')
        .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
      setPlayers(eligible)
      if (eligible.length > 0) setSelectedUid(eligible[0].uid)
      setLoadingPlayers(false)
    })
  }, [])

  // Reset "exported" badge when form changes
  useEffect(() => { setExported(false) }, [selectedUid, title, showPoints, showPosition, accentId])

  const selectedPlayer = players.find(p => p.uid === selectedUid)
  // players array is already sorted by points = leaderboard order
  const position = players.findIndex(p => p.uid === selectedUid) + 1

  async function handleExport() {
    if (!captureRef.current || !selectedPlayer) return
    setExporting(true)
    try {
      await document.fonts.ready
      const img = captureRef.current.querySelector('img')
      if (img && !img.complete) {
        await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res() })
      }
      const slug = selectedPlayer.displayName.replace(/\s+/g, '-').toLowerCase()
      await captureAndShare(captureRef.current, `premio-${slug}`, { forceDownload: false })
      setExported(true)
    } finally {
      setExporting(false)
    }
  }

  const cardProps = selectedPlayer
    ? { player: selectedPlayer, title, showPoints, showPosition, accentId, position }
    : null

  return (
    <>
      <style>{styles}</style>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: BEBAS, fontSize: '1.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>
          PREMIOS
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
          Genera una tarjeta coleccionable para reconocer a un jugador.
        </p>
      </div>

      {loadingPlayers ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Cargando jugadores...</p>
      ) : players.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No hay jugadores disponibles.</p>
      ) : (
        <div className="pr-layout">

          {/* ── Form ── */}
          <div className="pr-form-col">

            {/* Player */}
            <div className="pr-field">
              <label className="pr-label">Jugador</label>
              <select value={selectedUid} onChange={e => setSelectedUid(e.target.value)} className="pr-select">
                {players.map((p, i) => (
                  <option key={p.uid} value={p.uid}>
                    #{i + 1} · {p.displayName} · {p.stats.totalPoints} pts
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="pr-field">
              <label className="pr-label">Título del premio</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="MVP del Torneo"
                maxLength={40}
                className="pr-input"
              />
            </div>

            {/* Checkboxes */}
            <div className="pr-field">
              <label className="pr-label">Mostrar en la tarjeta</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className="pr-checkbox-row">
                  <input type="checkbox" checked={showPoints} onChange={e => setShowPoints(e.target.checked)} className="pr-checkbox" />
                  <span>Puntos totales</span>
                </label>
                <label className="pr-checkbox-row">
                  <input type="checkbox" checked={showPosition} onChange={e => setShowPosition(e.target.checked)} className="pr-checkbox" />
                  <span>Posición en la tabla</span>
                </label>
              </div>
            </div>

            {/* Color swatches */}
            <div className="pr-field">
              <label className="pr-label">Color de acento</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {ACCENT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAccentId(opt.id)}
                    title={opt.label}
                    className="pr-swatch"
                    style={{
                      background: opt.swatch,
                      outline: accentId === opt.id ? `3px solid ${opt.swatch}` : '3px solid transparent',
                      outlineOffset: 2,
                      transform: accentId === opt.id ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                {ACCENT_OPTIONS.find(o => o.id === accentId)?.label}
              </div>
            </div>

            {/* Export button */}
            <button onClick={handleExport} disabled={exporting} className="pr-btn-export">
              {exporting
                ? 'Preparando...'
                : exported
                ? '✓ Generada'
                : 'Descargar tarjeta'}
            </button>
          </div>

          {/* ── Preview ── */}
          <div className="pr-preview-col">
            <div className="pr-preview-label">Vista previa</div>
            {cardProps && (
              <div className="pr-preview-wrapper">
                <PaniniCard {...cardProps} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Off-screen card for html2canvas capture */}
      {cardProps && <PaniniCard {...cardProps} cardRef={captureRef} offScreen />}
    </>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = `
  .pr-layout {
    display: flex;
    flex-direction: column-reverse;
    gap: 32px;
    align-items: flex-start;
  }
  @media (min-width: 1024px) {
    .pr-layout {
      flex-direction: row;
    }
  }

  .pr-form-col {
    flex: 1;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
  }

  .pr-preview-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    width: 100%;
  }
  @media (min-width: 1024px) {
    .pr-preview-col {
      width: auto;
      position: sticky;
      top: 24px;
      align-items: flex-start;
    }
  }

  .pr-preview-label {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: rgba(255,255,255,0.22);
    text-transform: uppercase;
  }

  .pr-preview-wrapper {
    display: flex;
    justify-content: center;
  }

  .pr-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pr-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .pr-select, .pr-input {
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
  }
  .pr-select:focus, .pr-input:focus {
    border-color: var(--accent);
  }
  .pr-select option {
    background: #1a1d27;
    color: white;
  }
  .pr-input::placeholder { color: rgba(255,255,255,0.2); }

  .pr-checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.65);
  }
  .pr-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .pr-swatch {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.15);
    cursor: pointer;
    transition: transform 0.15s ease, outline 0.15s ease;
    flex-shrink: 0;
  }

  .pr-btn-export {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: var(--accent-deep);
    border: 1px solid var(--accent-muted);
    color: var(--accent-light);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-top: 4px;
  }
  .pr-btn-export:hover:not(:disabled) {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .pr-btn-export:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

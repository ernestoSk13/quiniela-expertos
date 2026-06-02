import { useRef } from 'react'

interface Props {
  displayName: string
  previewUrl: string
  onDisplayNameChange: (v: string) => void
  onFileChange: (file: File) => void
  onContinue: () => void
  loading: boolean
}

export default function StepProfile({
  displayName,
  previewUrl,
  onDisplayNameChange,
  onFileChange,
  onContinue,
  loading,
}: Props) {
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileChange(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const canContinue = displayName.trim().length > 0 && !loading

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        .sp-name-input {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          font-size: 1.4rem;
          letter-spacing: 0.07em;
          background: rgba(38, 50, 38, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          border-radius: 0.75rem;
          padding: 0.7rem 1rem;
          width: 100%;
          outline: none;
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
          text-transform: uppercase;
        }
        .sp-name-input::placeholder {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          color: rgba(255,255,255,0.18);
          text-transform: uppercase;
        }
        .sp-name-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-muted), 0 0 14px var(--accent-muted);
        }

        .sp-upload-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.35rem 0.85rem;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.5);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .sp-upload-pill:hover {
          border-color: var(--accent);
          color: var(--accent-light);
          background: var(--accent-deep);
        }

        .sp-continue {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1rem;
          border-radius: 0.875rem;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .sp-continue-on {
          background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 60%);
          box-shadow: 0 4px 18px var(--accent-muted), inset 0 1px 0 rgba(255,255,255,0.12);
          color: #fff;
        }
        .sp-continue-on:hover { opacity: 0.9; }
        .sp-continue-on:active { transform: scale(0.98); }
        .sp-continue-off {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.18);
          cursor: not-allowed;
        }
      `}</style>

      <div className="space-y-7">

        {/* ── Avatar / player card photo zone ── */}
        <div className="flex flex-col items-center gap-3 pt-2">

          {/* Instruction */}
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase select-none"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Agrega tu avatar
          </p>

          {/* Portrait rectangle avatar */}
          <div
            style={{
              width: 96, height: 128,
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 20px var(--accent-muted)',
              background: 'rgba(255,255,255,0.04)',
              flexShrink: 0,
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                alt="Avatar"
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bebas Neue', Impact, 'Arial Narrow', sans-serif",
                fontSize: '3.5rem',
                color: 'var(--accent)',
                opacity: 0.7,
                userSelect: 'none',
              }}>
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>

          {/* Two action pills */}
          <div className="flex items-center gap-2">
            {/* Take photo — opens front camera directly */}
            <button
              type="button"
              className="sp-upload-pill"
              onClick={() => cameraInputRef.current?.click()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Tomar foto
            </button>

            {/* Choose from gallery */}
            <button
              type="button"
              className="sp-upload-pill"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {previewUrl ? 'Cambiar' : 'Galería'}
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFile}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* ── Name input ── */}
        <div>
          <label
            className="block text-[9px] font-semibold tracking-[0.25em] uppercase mb-2.5"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Tu nombre en el marcador
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => onDisplayNameChange(e.target.value)}
            placeholder="TU NOMBRE"
            maxLength={30}
            className="sp-name-input"
          />
          <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Así aparecerás en el marcador general
          </p>
        </div>

        {/* ── Continue button ── */}
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`sp-continue ${canContinue ? 'sp-continue-on' : 'sp-continue-off'}`}
        >
          {loading ? 'Cargando…' : (
            <>
              <span>Continuar</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          )}
        </button>

      </div>
    </>
  )
}

interface Props {
  onDigit: (d: number) => void
  onDelete: () => void
  onSave: () => void
  dirtyCount: number
  saving: boolean
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function BackspaceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
      <line x1="18" y1="9" x2="12" y2="15"/>
      <line x1="12" y1="9" x2="18" y2="15"/>
    </svg>
  )
}

export default function NumericKeypad({ onDigit, onDelete, onSave, dirtyCount, saving }: Props) {
  const hasChanges = dirtyCount > 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        .kp-digit {
          font-family: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
          font-size: 1.75rem;
          line-height: 1;
          letter-spacing: 0.04em;
          height: 3.25rem;
          border-radius: 0.875rem;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.065) 0%,
            rgba(255,255,255,0.02) 100%
          );
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 2px 6px rgba(0,0,0,0.35);
          color: rgba(255,255,255,0.88);
          transition: background 0.1s ease, transform 0.08s ease, box-shadow 0.08s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .kp-digit:active {
          transform: scale(0.93);
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.04) 0%,
            rgba(255,255,255,0.01) 100%
          );
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,0.4),
            0 1px 2px rgba(0,0,0,0.3);
        }

        .kp-delete {
          height: 3.25rem;
          border-radius: 0.875rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 4px rgba(0,0,0,0.3);
          color: rgba(255,255,255,0.5);
          transition: color 0.1s ease, background 0.1s ease, transform 0.08s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }
        .kp-delete:active {
          transform: scale(0.93);
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.07);
        }

        .kp-save {
          width: 100%;
          border-radius: 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.7rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          transition: opacity 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
          cursor: pointer;
          border: none;
          -webkit-tap-highlight-color: transparent;
        }
        .kp-save-active {
          background: linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 55%, var(--accent-hover, var(--accent)) 100%);
          box-shadow: 0 4px 18px var(--accent-muted), 0 1px 0 rgba(255,255,255,0.15) inset;
          color: #fff;
        }
        .kp-save-active:active {
          transform: scale(0.98);
          box-shadow: 0 2px 8px var(--accent-muted);
        }
        .kp-save-disabled {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.2);
          cursor: default;
        }

        .kp-badge {
          background: rgba(255,255,255,0.2);
          border-radius: 99px;
          padding: 0.1rem 0.45rem;
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1.4;
          letter-spacing: 0.03em;
        }

        .kp-rule {
          height: 1px;
          background: linear-gradient(
            to right,
            transparent 0%,
            rgba(255,255,255,0.07) 30%,
            rgba(255,255,255,0.07) 70%,
            transparent 100%
          );
          margin: 0 -1rem;
        }

        @keyframes kp-saving-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .kp-saving { animation: kp-saving-pulse 1s ease-in-out infinite; }
      `}</style>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 px-3 pt-3"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)',
          background: 'rgba(8,18,10,0.82)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Save button */}
        <button
          onClick={onSave}
          disabled={saving || !hasChanges}
          className={`kp-save mb-3 ${hasChanges && !saving ? 'kp-save-active' : 'kp-save-disabled'} ${saving ? 'kp-saving' : ''}`}
        >
          {saving ? (
            <span>Guardando…</span>
          ) : hasChanges ? (
            <>
              <span>Guardar pronósticos</span>
              <span className="kp-badge">{dirtyCount}</span>
            </>
          ) : (
            <span>Sin cambios</span>
          )}
        </button>

        {/* Thin rule */}
        <div className="kp-rule mb-3" />

        {/* Digit grid */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {DIGITS.map(d => (
            <button
              key={d}
              onClick={() => onDigit(d)}
              className="kp-digit"
            >
              {d}
            </button>
          ))}

          {/* Bottom row: 0 wide + delete */}
          <button
            onClick={() => onDigit(0)}
            className="kp-digit col-span-2"
          >
            0
          </button>
          <button
            onClick={onDelete}
            className="kp-delete"
            aria-label="Borrar"
          >
            <BackspaceIcon />
          </button>
        </div>
      </div>
    </>
  )
}

import { useState, useRef, useEffect } from 'react'
import { THEMES, type ThemeId } from '@/lib/themes'
import { updateUserTheme } from '@/services/firestoreUsers'
import { useAuth } from '@/context/AuthContext'

export default function ThemeSelector() {
  const { user } = useAuth()
  const current: ThemeId = user?.theme ?? 'mexico'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentTheme = THEMES.find(t => t.id === current) ?? THEMES[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSelect(id: ThemeId) {
    setOpen(false)
    if (!user || id === current) return
    await updateUserTheme(user.uid, id)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px 4px 8px',
          borderRadius: 99,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.75rem', fontWeight: 600,
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, background 0.15s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-deep)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentTheme.flag}</span>
        <span>Tema</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
          style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        >
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--surface-nav)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          padding: 8,
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 2,
          minWidth: 200,
          zIndex: 50,
        }}>
          {THEMES.map(t => {
            const isActive = t.id === current
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'var(--accent-deep)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  outline: isActive ? '1px solid var(--accent-muted)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>{t.flag}</span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 500,
                  color: isActive ? 'var(--accent-light)' : 'rgba(255,255,255,0.55)',
                  whiteSpace: 'nowrap',
                }}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

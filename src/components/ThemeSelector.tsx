import { THEMES, type ThemeId } from '@/lib/themes'
import { updateUserTheme } from '@/services/firestoreUsers'
import { useAuth } from '@/context/AuthContext'

export default function ThemeSelector() {
  const { user } = useAuth()
  const current: ThemeId = user?.theme ?? 'mexico'

  async function handleSelect(id: ThemeId) {
    if (!user || id === current) return
    await updateUserTheme(user.uid, id)
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-1"
      style={{
        background: 'rgba(255,255,255,0.045)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => handleSelect(t.id)}
          title={t.label}
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm leading-none transition-all duration-200"
          style={
            current === t.id
              ? {
                  background: 'var(--accent-muted)',
                  boxShadow: '0 0 0 1.5px var(--accent)',
                }
              : {
                  opacity: 0.55,
                }
          }
        >
          {t.flag}
        </button>
      ))}
    </div>
  )
}

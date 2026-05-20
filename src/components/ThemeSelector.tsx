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
    <div className="flex gap-2">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => handleSelect(t.id)}
          title={t.label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            current === t.id
              ? 'bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--accent-light)]'
              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
          }`}
        >
          <span>{t.flag}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

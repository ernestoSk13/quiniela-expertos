import { createContext, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { themeClassName, type ThemeId } from '@/lib/themes'

interface ThemeContextValue {
  themeId: ThemeId
}

const ThemeContext = createContext<ThemeContextValue>({ themeId: 'mexico' })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const themeId: ThemeId = user?.theme ?? 'mexico'

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-canada', 'theme-usa')
    const cls = themeClassName(themeId)
    if (cls) root.classList.add(cls)
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ themeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

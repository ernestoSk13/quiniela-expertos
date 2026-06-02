import { createContext, useContext, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { themeClassName, THEMES, type ThemeId } from '@/lib/themes'

interface ThemeContextValue {
  themeId: ThemeId
  colorMode: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextValue>({ themeId: 'mexico', colorMode: 'dark' })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const themeId: ThemeId = user?.theme ?? 'mexico'
  const colorMode: 'dark' | 'light' = user?.colorMode ?? 'dark'

  useEffect(() => {
    const root = document.documentElement
    THEMES.forEach(t => { if (t.className) root.classList.remove(t.className) })
    const cls = themeClassName(themeId)
    if (cls) root.classList.add(cls)
  }, [themeId])

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', colorMode === 'light')
  }, [colorMode])

  return (
    <ThemeContext.Provider value={{ themeId, colorMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

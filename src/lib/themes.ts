export type ThemeId = 'mexico' | 'canada' | 'usa'

export interface Theme {
  id: ThemeId
  label: string
  flag: string
  className: string
}

export const THEMES: Theme[] = [
  { id: 'mexico', label: 'México',  flag: '🇲🇽', className: '' },
  { id: 'canada', label: 'Canadá',  flag: '🇨🇦', className: 'theme-canada' },
  { id: 'usa',    label: 'EUA',     flag: '🇺🇸', className: 'theme-usa' },
]

export function themeClassName(id: ThemeId | undefined): string {
  return THEMES.find(t => t.id === id)?.className ?? ''
}

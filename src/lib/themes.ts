export type ThemeId = 'mexico' | 'canada' | 'usa' | 'germany' | 'france' | 'argentina' | 'spain' | 'belgium' | 'ivory-coast' | 'brazil'

export interface Theme {
  id: ThemeId
  label: string
  flag: string
  className: string
}

export const THEMES: Theme[] = [
  { id: 'mexico',      label: 'México',          flag: '🇲🇽', className: '' },
  { id: 'canada',      label: 'Canadá',           flag: '🇨🇦', className: 'theme-canada' },
  { id: 'usa',         label: 'EUA',              flag: '🇺🇸', className: 'theme-usa' },
  { id: 'germany',     label: 'Alemania',         flag: '🇩🇪', className: 'theme-germany' },
  { id: 'france',      label: 'Francia',          flag: '🇫🇷', className: 'theme-france' },
  { id: 'argentina',   label: 'Argentina',        flag: '🇦🇷', className: 'theme-argentina' },
  { id: 'spain',       label: 'España',           flag: '🇪🇸', className: 'theme-spain' },
  { id: 'belgium',     label: 'Bélgica',          flag: '🇧🇪', className: 'theme-belgium' },
  { id: 'ivory-coast', label: 'Costa de Marfil',  flag: '🇨🇮', className: 'theme-ivory-coast' },
  { id: 'brazil',      label: 'Brasil',           flag: '🇧🇷', className: 'theme-brazil' },
]

export function themeClassName(id: ThemeId | undefined): string {
  return THEMES.find(t => t.id === id)?.className ?? ''
}

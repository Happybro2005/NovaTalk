import type { UserSettings } from '../types/models'

const themeStorageKey = 'novatalk-theme'

export function getStoredTheme(): UserSettings['theme'] | null {
  if (typeof window === 'undefined') return null
  const storedTheme = window.localStorage.getItem(themeStorageKey)
  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : null
}

export function applyTheme(theme: UserSettings['theme']) {
  if (typeof window === 'undefined') return
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme
  document.documentElement.dataset.theme = resolvedTheme
  window.localStorage.setItem(themeStorageKey, theme)
}

export function watchTheme(theme: UserSettings['theme']) {
  applyTheme(theme)
  if (theme !== 'system') return () => undefined

  const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
  const handleChange = () => applyTheme('system')
  mediaQuery.addEventListener('change', handleChange)

  return () => mediaQuery.removeEventListener('change', handleChange)
}

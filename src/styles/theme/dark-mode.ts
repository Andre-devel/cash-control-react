export const THEME_STORAGE_KEY = 'cash-control-react:theme'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
    return null
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore storage errors in restricted environments
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(theme: Theme | null): ResolvedTheme {
  if (!theme || theme === 'system') return getSystemTheme()
  return theme
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function initializeTheme(): void {
  const stored = getStoredTheme()
  const resolved = resolveTheme(stored)
  applyTheme(resolved)
}

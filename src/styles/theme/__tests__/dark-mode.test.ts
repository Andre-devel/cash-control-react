import { describe, it, expect, beforeEach } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  initializeTheme,
  resolveTheme,
  storeTheme,
} from '../dark-mode'

describe('dark-mode utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('applyTheme', () => {
    it('sets data-theme="dark" on <html> when theme is dark', () => {
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('sets data-theme="light" on <html> when theme is light', () => {
      applyTheme('dark')
      applyTheme('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('is idempotent: applying dark twice keeps data-theme="dark"', () => {
      applyTheme('dark')
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  describe('storeTheme', () => {
    it('writes the theme value to localStorage under the namespaced key', () => {
      storeTheme('dark')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })

    it('overwrites a previous value', () => {
      storeTheme('dark')
      storeTheme('light')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    })

    it('stores the system value', () => {
      storeTheme('system')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    })
  })

  describe('getStoredTheme', () => {
    it('returns null when nothing is stored', () => {
      expect(getStoredTheme()).toBeNull()
    })

    it('returns dark when dark is stored', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      expect(getStoredTheme()).toBe('dark')
    })

    it('returns light when light is stored', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      expect(getStoredTheme()).toBe('light')
    })

    it('returns system when system is stored', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'system')
      expect(getStoredTheme()).toBe('system')
    })

    it('returns null for an unrecognized stored value', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'invalid-value')
      expect(getStoredTheme()).toBeNull()
    })
  })

  describe('getSystemTheme', () => {
    it('returns light or dark (never throws in jsdom)', () => {
      const result = getSystemTheme()
      expect(['light', 'dark']).toContain(result)
    })
  })

  describe('resolveTheme', () => {
    it('returns dark for explicit dark theme', () => {
      expect(resolveTheme('dark')).toBe('dark')
    })

    it('returns light for explicit light theme', () => {
      expect(resolveTheme('light')).toBe('light')
    })

    it('returns a resolved value for null (falls back to system)', () => {
      const result = resolveTheme(null)
      expect(['light', 'dark']).toContain(result)
    })

    it('returns a resolved value for system (falls back to system preference)', () => {
      const result = resolveTheme('system')
      expect(['light', 'dark']).toContain(result)
    })
  })

  describe('initializeTheme', () => {
    it('sets data-theme="dark" when dark is persisted in localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      initializeTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('sets data-theme="light" when light is persisted in localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      initializeTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('applies a resolved theme when nothing is stored', () => {
      initializeTheme()
      const theme = document.documentElement.getAttribute('data-theme')
      expect(['light', 'dark']).toContain(theme)
    })
  })

  describe('THEME_STORAGE_KEY', () => {
    it('is namespaced to avoid collision with third-party storage', () => {
      expect(THEME_STORAGE_KEY).toContain(':')
      expect(THEME_STORAGE_KEY).toMatch(/^cash-control-react:/)
    })
  })
})

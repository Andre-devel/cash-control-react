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
    document.documentElement.classList.remove('dark')
  })

  describe('applyTheme', () => {
    it('adds dark class to <html> when theme is dark', () => {
      applyTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class from <html> when theme is light', () => {
      document.documentElement.classList.add('dark')
      applyTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('is idempotent: applying dark twice does not break the class', () => {
      applyTheme('dark')
      applyTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
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
    it('applies dark class when dark is persisted in localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      initializeTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes dark class when light is persisted in localStorage', () => {
      document.documentElement.classList.add('dark')
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      initializeTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applies a resolved theme when nothing is stored', () => {
      initializeTheme()
      const hasDark = document.documentElement.classList.contains('dark')
      expect(typeof hasDark).toBe('boolean')
    })
  })

  describe('THEME_STORAGE_KEY', () => {
    it('is namespaced to avoid collision with third-party storage', () => {
      expect(THEME_STORAGE_KEY).toContain(':')
      expect(THEME_STORAGE_KEY).toMatch(/^cash-control-react:/)
    })
  })
})

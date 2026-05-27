import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../auth.store'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

const AUTH_STORAGE_KEY = 'cash-control-react:auth'

const testUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['USER'],
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

describe('auth store — setToken', () => {
  it('sets the token and marks isAuthenticated as true', () => {
    useAuthStore.getState().setToken('jwt-token-123')
    const state = useAuthStore.getState()
    expect(state.token).toBe('jwt-token-123')
    expect(state.isAuthenticated).toBe(true)
  })

  it('initial state has no token and isAuthenticated is false', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})

describe('auth store — setUser', () => {
  it('stores user data in the store', () => {
    useAuthStore.getState().setUser(testUser)
    expect(useAuthStore.getState().user).toEqual(testUser)
  })
})

describe('auth store — clearSession', () => {
  it('clears the token and sets isAuthenticated to false', () => {
    useAuthStore.getState().setToken('jwt-token-123')
    useAuthStore.getState().clearSession()
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('clears user data on logout', () => {
    useAuthStore.getState().setUser(testUser)
    useAuthStore.getState().clearSession()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('is safe to call multiple times', () => {
    useAuthStore.getState().clearSession()
    useAuthStore.getState().clearSession()
    expect(useAuthStore.getState().token).toBeNull()
  })
})

describe('auth store — persist middleware', () => {
  it('persists token to localStorage under the namespaced key', () => {
    useAuthStore.getState().setToken('persisted-token')
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.token).toBe('persisted-token')
    expect(parsed.state.isAuthenticated).toBe(true)
  })

  it('clears localStorage entry after clearSession', () => {
    useAuthStore.getState().setToken('persisted-token')
    useAuthStore.getState().clearSession()
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.state.token).toBeNull()
      expect(parsed.state.isAuthenticated).toBe(false)
    } else {
      expect(stored).toBeNull()
    }
  })
})

describe('auth store — setTheme', () => {
  it('stores the theme in state', () => {
    useAuthStore.getState().setTheme('dark')
    expect(useAuthStore.getState().theme).toBe('dark')
  })

  it('defaults theme to system in initial state', () => {
    expect(useAuthStore.getState().theme).toBe('system')
  })
})

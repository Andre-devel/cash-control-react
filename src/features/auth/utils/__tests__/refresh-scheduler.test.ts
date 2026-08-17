import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from '@/features/auth/store/auth.store'
import {
  startTokenRefreshScheduler,
  stopTokenRefreshScheduler,
} from '@/features/auth/utils/refresh-scheduler'

const refreshAccessToken = vi.fn()

vi.mock('@/services/http', () => ({
  refreshAccessToken: () => refreshAccessToken() as Promise<string>,
}))

/** Builds a token whose only meaningful claim is its expiry. */
function tokenExpiringIn(seconds: number): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + seconds }
  return `header.${btoa(JSON.stringify(payload))}.signature`
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  refreshAccessToken.mockReset()
  refreshAccessToken.mockResolvedValue('renewed-token')
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  stopTokenRefreshScheduler()
  vi.useRealTimers()
})

describe('refresh scheduler', () => {
  it('renews shortly before the access token expires', () => {
    startTokenRefreshScheduler()
    useAuthStore.getState().setToken(tokenExpiringIn(15 * 60))

    vi.advanceTimersByTime(13 * 60 * 1000)
    expect(refreshAccessToken).not.toHaveBeenCalled()

    // 60s margin: the renewal fires one minute before expiry
    vi.advanceTimersByTime(60 * 1000)
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('does not schedule anything without a session', () => {
    startTokenRefreshScheduler()

    vi.advanceTimersByTime(60 * 60 * 1000)

    expect(refreshAccessToken).not.toHaveBeenCalled()
  })

  it('stops renewing once the session is cleared', () => {
    startTokenRefreshScheduler()
    useAuthStore.getState().setToken(tokenExpiringIn(15 * 60))
    useAuthStore.getState().clearSession()

    vi.advanceTimersByTime(60 * 60 * 1000)

    expect(refreshAccessToken).not.toHaveBeenCalled()
  })

  it('renews on tab focus when the deadline passed while hidden', () => {
    startTokenRefreshScheduler()
    useAuthStore.getState().setToken(tokenExpiringIn(30))

    setVisibility('hidden')
    setVisibility('visible')

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('leaves a still-fresh token alone on tab focus', () => {
    startTokenRefreshScheduler()
    useAuthStore.getState().setToken(tokenExpiringIn(15 * 60))

    setVisibility('visible')

    expect(refreshAccessToken).not.toHaveBeenCalled()
  })
})

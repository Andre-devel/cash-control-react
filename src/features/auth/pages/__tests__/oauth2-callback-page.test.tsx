import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { useAuthStore } from '@/features/auth/store/auth.store'
import OAuth2CallbackPage from '../oauth2-callback-page'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
  storeTheme: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

describe('OAuth2CallbackPage', () => {
  it('exchanges the refresh cookie for a session and goes to the dashboard', async () => {
    server.use(
      http.post('*/auth/refresh', () =>
        HttpResponse.json({
          accessToken: 'google.access.token',
          tokenType: 'Bearer',
          expiresInSeconds: 900,
        }),
      ),
    )

    renderWithProviders(<OAuth2CallbackPage />)

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeTruthy()
    const state = useAuthStore.getState()
    expect(state.token).toBe('google.access.token')
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).not.toBeNull()
  })

  it('shows the failure message when the refresh is rejected', async () => {
    server.use(http.post('*/auth/refresh', () => new HttpResponse(null, { status: 401 })))

    renderWithProviders(<OAuth2CallbackPage />)

    expect(
      await screen.findByRole('heading', { name: /não foi possível entrar com google/i }),
    ).toBeTruthy()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('shows the failure message straight away on the error redirect', async () => {
    const refresh = vi.fn()
    server.use(
      http.post('*/auth/refresh', () => {
        refresh()
        return new HttpResponse(null, { status: 401 })
      }),
    )

    renderWithProviders(<OAuth2CallbackPage />, { initialRoute: '/test?error=oauth_failed' })

    expect(
      await screen.findByRole('heading', { name: /não foi possível entrar com google/i }),
    ).toBeTruthy()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('explains when the account is locked or unavailable', async () => {
    renderWithProviders(<OAuth2CallbackPage />, {
      initialRoute: '/test?error=account_unavailable',
    })

    expect(await screen.findByText(/bloqueada ou indisponível/i)).toBeTruthy()
  })
})

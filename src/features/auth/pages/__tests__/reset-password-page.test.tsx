import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { useAuthStore } from '@/features/auth/store/auth.store'
import ResetPasswordPage from '../reset-password-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

describe('ResetPasswordPage', () => {
  it('shows invalid link message when no token in URL', async () => {
    renderWithProviders(<ResetPasswordPage />, { initialRoute: '/test' })
    expect(await screen.findByRole('heading', { name: /link inválido/i })).toBeTruthy()
  })

  it('shows password form when valid token is present', async () => {
    renderWithProviders(<ResetPasswordPage />, { initialRoute: '/test?token=valid-token' })
    expect(await screen.findByRole('heading', { name: /nova senha/i })).toBeTruthy()
    expect(screen.getAllByLabelText(/nova senha/i).length).toBeGreaterThan(0)
  })

  it('shows validation error for password shorter than 8 chars', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, { initialRoute: '/test?token=valid-token' })

    await screen.findByRole('heading', { name: /nova senha/i })
    await user.type(screen.getByLabelText(/^nova senha/i), 'short')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'short')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    expect(await screen.findByText(/pelo menos 8 caracteres/i)).toBeTruthy()
  })

  it('shows expired token message after TOKEN_EXPIRED error', async () => {
    renderWithProviders(<ResetPasswordPage />, { initialRoute: '/test?token=expired-token' })

    await screen.findByRole('heading', { name: /nova senha/i })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/^nova senha/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'newpass123')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    expect(await screen.findByRole('heading', { name: /link expirado/i })).toBeTruthy()
  })

  it('shows success toast and navigates to login on success', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<ResetPasswordPage />, { initialRoute: '/test?token=valid-token' })

    await screen.findByRole('heading', { name: /nova senha/i })
    await user.type(screen.getByLabelText(/^nova senha/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'newpass123')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Senha redefinida com sucesso. Faça login para continuar.',
      )
    })

    expect(await screen.findByRole('heading', { name: /login/i })).toBeTruthy()
  })
})

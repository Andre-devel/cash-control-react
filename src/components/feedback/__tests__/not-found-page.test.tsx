import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFoundPage from '../not-found-page'
import { useAuthStore } from '@/features/auth/store/auth.store'

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.getState().clearSession()
})

describe('NotFoundPage', () => {
  it('links to login when signed out', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir para o login' }).getAttribute('href')).toBe(
      '/login',
    )
  })

  it('links to the dashboard when signed in', () => {
    useAuthStore.getState().setToken('token')
    renderPage()
    expect(screen.getByRole('link', { name: 'Ir para o dashboard' }).getAttribute('href')).toBe(
      '/dashboard',
    )
  })
})

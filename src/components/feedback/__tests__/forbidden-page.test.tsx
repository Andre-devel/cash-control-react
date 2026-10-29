import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ForbiddenPage from '../forbidden-page'

afterEach(() => cleanup())

describe('ForbiddenPage', () => {
  it('explains the missing permission and links to the dashboard', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Você não tem permissão' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir para o dashboard' }).getAttribute('href')).toBe(
      '/dashboard',
    )
  })

  it('"Voltar" returns to the previous page', async () => {
    render(
      <MemoryRouter initialEntries={['/anterior', '/forbidden']} initialIndex={1}>
        <Routes>
          <Route path="/anterior" element={<p>Página anterior</p>} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('Página anterior')).toBeTruthy()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { RoleCard } from '../role-card'
import { MOCK_ROLE, MOCK_SYSTEM_ROLE } from '@/test/handlers/roles.handlers'
import type { Role } from '@/features/roles/types'

function renderCard(role: Role) {
  const router = createMemoryRouter(
    [
      { path: '/test', element: <RoleCard role={role} /> },
      { path: '/admin/roles/:roleId', element: <div>Role Detail</div> },
    ],
    { initialEntries: ['/test'] },
  )
  render(<RouterProvider router={router} />)
}

describe('RoleCard', () => {
  it('renders role name', () => {
    renderCard(MOCK_ROLE)
    expect(screen.getByText(MOCK_ROLE.name)).toBeTruthy()
  })

  it('renders role description when present', () => {
    renderCard(MOCK_ROLE)
    expect(screen.getByText(MOCK_ROLE.description)).toBeTruthy()
  })

  it('does not render description paragraph when description is empty', () => {
    renderCard({ ...MOCK_ROLE, description: '' })
    expect(screen.queryByText(MOCK_ROLE.description)).toBeNull()
  })

  it('renders System badge for system roles', () => {
    renderCard(MOCK_SYSTEM_ROLE)
    expect(screen.getByText('System')).toBeTruthy()
  })

  it('does not render System badge for non-system roles', () => {
    renderCard(MOCK_ROLE)
    expect(screen.queryByText('System')).toBeNull()
  })

  it('links to the correct role detail URL', () => {
    renderCard(MOCK_ROLE)
    const link = screen.getByRole('link', { name: new RegExp(MOCK_ROLE.name) })
    expect(link.getAttribute('href')).toContain(MOCK_ROLE.id)
  })

  it('aria-label contains the role name', () => {
    renderCard(MOCK_ROLE)
    expect(screen.getByRole('link', { name: new RegExp(MOCK_ROLE.name, 'i') })).toBeTruthy()
  })
})

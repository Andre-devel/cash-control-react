import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/utils'
import { MOCK_ROLE, MOCK_SYSTEM_ROLE, MOCK_PERMISSION } from '@/test/handlers/roles.handlers'
import { useAuthStore } from '@/features/auth/store/auth.store'
import RoleDetailPage from '../role-detail-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

const FULL_PERMISSIONS_USER = {
  id: 'test-user',
  email: 'admin@example.com',
  name: 'Admin User',
  roles: ['ADMIN'],
  permissions: [
    'role:create',
    'role:update',
    'role:delete',
    'permission:grant',
    'permission:revoke',
  ],
}

beforeEach(() => {
  useAuthStore.getState().setUser(FULL_PERMISSIONS_USER)
})

afterEach(() => {
  useAuthStore.getState().clearSession()
  cleanup()
})

function renderDetailPage(roleId: string) {
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter(
    [
      { path: '/admin/roles/:roleId', element: <RoleDetailPage /> },
      {
        path: '/admin/roles',
        element: (
          <div>
            <h1>Roles</h1>
          </div>
        ),
      },
    ],
    { initialEntries: [`/admin/roles/${roleId}`] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('RoleDetailPage', () => {
  it('renders loading skeleton before data arrives', () => {
    renderDetailPage(MOCK_ROLE.id)
    expect(screen.getByLabelText('Carregando detalhes do papel')).toBeTruthy()
  })

  it('renders role name from MSW data', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByText(MOCK_ROLE.name)).toBeTruthy()
    })
  })

  it('renders role description', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByText(MOCK_ROLE.description)).toBeTruthy()
    })
  })

  it('renders back navigation link', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /voltar para lista de papéis/i })).toBeTruthy()
    })
  })

  it('renders Edit Role button', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar papel/i })).toBeTruthy()
    })
  })

  it('renders Delete Role button', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /excluir papel/i })).toBeTruthy()
    })
  })

  it('system badge visible for system role', async () => {
    renderDetailPage(MOCK_SYSTEM_ROLE.id)

    await waitFor(() => {
      expect(screen.getByText(MOCK_SYSTEM_ROLE.name)).toBeTruthy()
      expect(screen.getByLabelText('Papel do sistema')).toBeTruthy()
    })
  })

  it('Delete Role button is disabled for system roles', async () => {
    renderDetailPage(MOCK_SYSTEM_ROLE.id)

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /excluir papel/i })
      expect(deleteButton).toBeDisabled()
    })
  })

  it('Delete Role button is enabled for non-system roles', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /excluir papel/i })
      expect(deleteButton).not.toBeDisabled()
    })
  })

  it('permissions panel renders all assigned permissions', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByText(MOCK_PERMISSION.name)).toBeTruthy()
      expect(screen.getByText(MOCK_PERMISSION.description)).toBeTruthy()
    })
  })

  it('permissions panel renders Remove button per permission', async () => {
    renderDetailPage(MOCK_ROLE.id)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remover permissão/i })).toBeTruthy()
    })
  })

  it('permissions panel renders empty state when no permissions', async () => {
    renderDetailPage(MOCK_SYSTEM_ROLE.id)

    await waitFor(() => {
      expect(screen.getByText(/nenhuma permissão atribuída/i)).toBeTruthy()
    })
  })

  it('not-found state renders on 404 response', async () => {
    renderDetailPage('not-found')

    await waitFor(() => {
      expect(screen.getByText(/papel não encontrado/i)).toBeTruthy()
    })
  })

  it('not-found state offers navigation back to list', async () => {
    renderDetailPage('not-found')

    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /voltar para lista de papéis/i })
      expect(links.length).toBeGreaterThan(0)
    })
  })

  it('error state renders on non-404 API failure', async () => {
    server.use(
      http.get('*/roles/:roleId', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )

    renderDetailPage('any-role')

    await waitFor(() => {
      expect(screen.getByText(/falha ao carregar papel/i)).toBeTruthy()
    })
  })

  describe('update role', () => {
    it('Edit Role button opens the edit modal', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeTruthy()
        expect(screen.getByRole('heading', { name: /editar papel/i })).toBeTruthy()
      })
    })

    it('edit modal shows role name as read-only', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))

      await waitFor(() => screen.getByRole('dialog'))

      const nameInput = screen.getByDisplayValue(MOCK_ROLE.name)
      expect(nameInput).toBeDisabled()
    })

    it('update form → success → modal closes', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))
      await waitFor(() => screen.getByRole('dialog'))

      await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })

    it('update form pre-populates description', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))

      await waitFor(() => {
        expect(screen.getByDisplayValue(MOCK_ROLE.description)).toBeTruthy()
      })
    })
  })

  describe('delete role', () => {
    it('Delete Role button opens confirmation dialog', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeTruthy()
      })
    })

    it('confirmation dialog displays the role name', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog')
        expect(within(dialog).getAllByText(MOCK_ROLE.name).length).toBeGreaterThan(0)
      })
    })

    it('Cancel closes dialog without API call', async () => {
      const user = userEvent.setup()
      let deleteCalled = false
      server.use(
        http.delete('*/roles/:roleId', () => {
          deleteCalled = true
          return new HttpResponse(null, { status: 204 })
        }),
      )

      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))
      await waitFor(() => screen.getByRole('alertdialog'))
      await user.click(screen.getByRole('button', { name: /cancelar/i }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull()
      })
      expect(deleteCalled).toBe(false)
    })

    it('delete → success → navigates to /admin/roles', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))
      await waitFor(() => screen.getByRole('alertdialog'))
      await user.click(screen.getByRole('button', { name: /^excluir$/i }))

      await waitFor(() => {
        expect(screen.getByText(/^Roles$/i)).toBeTruthy()
      })
    })

    it('delete → 409 → error toast, no navigation', async () => {
      const { toast } = await import('@/lib/toast')
      server.use(
        http.delete('*/roles/:roleId', () =>
          HttpResponse.json(
            { errorCode: 'ROLE_IN_USE', message: 'Role is still assigned.', correlationId: 'c' },
            { status: 409 },
          ),
        ),
      )

      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))
      await waitFor(() => screen.getByRole('alertdialog'))
      await user.click(screen.getByRole('button', { name: /^excluir$/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
      expect(screen.queryByText(/^Roles$/i)).toBeNull()
    })

    it('system role → Delete button is disabled with aria-disabled', async () => {
      renderDetailPage(MOCK_SYSTEM_ROLE.id)

      await waitFor(() => {
        const deleteBtn = screen.getByRole('button', { name: /excluir papel/i })
        expect(deleteBtn).toBeDisabled()
        expect(deleteBtn).toHaveAttribute('aria-disabled', 'true')
      })
    })
  })

  describe('permission-aware rendering', () => {
    it('Edit Role button is hidden when user lacks role:update', async () => {
      useAuthStore.getState().setUser({
        ...FULL_PERMISSIONS_USER,
        permissions: ['role:create', 'role:delete'],
      })
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByText(MOCK_ROLE.name))

      expect(screen.queryByRole('button', { name: /editar papel/i })).toBeNull()
    })

    it('Edit Role button is visible when user has role:update', async () => {
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar papel/i })).toBeTruthy()
      })
    })

    it('Delete Role button is hidden when user lacks role:delete', async () => {
      useAuthStore.getState().setUser({
        ...FULL_PERMISSIONS_USER,
        permissions: ['role:create', 'role:update'],
      })
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByText(MOCK_ROLE.name))

      expect(screen.queryByRole('button', { name: /excluir papel/i })).toBeNull()
    })

    it('Delete Role button is visible when user has role:delete', async () => {
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /excluir papel/i })).toBeTruthy()
      })
    })

    it('Delete Role button is disabled with aria-disabled for system role even with role:delete', async () => {
      renderDetailPage(MOCK_SYSTEM_ROLE.id)

      await waitFor(() => {
        const deleteBtn = screen.getByRole('button', { name: /excluir papel/i })
        expect(deleteBtn).toBeDisabled()
        expect(deleteBtn).toHaveAttribute('aria-disabled', 'true')
      })
    })
  })

  describe('Phase 9 — accessibility', () => {
    it('Edit Role button meets 44px touch target (min-h-[44px])', async () => {
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))

      expect(screen.getByRole('button', { name: /editar papel/i }).className).toContain(
        'min-h-[44px]',
      )
    })

    it('Delete Role button meets 44px touch target (min-h-[44px])', async () => {
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))

      expect(screen.getByRole('button', { name: /excluir papel/i }).className).toContain(
        'min-h-[44px]',
      )
    })

    it('system role Delete button meets 44px touch target (min-h-[44px])', async () => {
      renderDetailPage(MOCK_SYSTEM_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))

      expect(screen.getByRole('button', { name: /excluir papel/i }).className).toContain(
        'min-h-[44px]',
      )
    })

    it('Escape key closes the edit modal', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))
      await waitFor(() => screen.getByRole('dialog'))

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })

    it('Escape key closes the delete confirmation dialog', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))
      await waitFor(() => screen.getByRole('alertdialog'))

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull()
      })
    })

    it('system role delete button tooltip trigger is keyboard focusable', async () => {
      renderDetailPage(MOCK_SYSTEM_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))

      const deleteBtn = screen.getByRole('button', { name: /excluir papel/i })
      // The TooltipTrigger wraps the disabled button in a focusable span so
      // keyboard users can still reach it and receive the tooltip content
      const triggerSpan = deleteBtn.parentElement as HTMLElement
      expect(triggerSpan.getAttribute('tabindex')).toBe('0')
    })

    it('edit form: Description field has accessible label', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))
      await waitFor(() => screen.getByRole('dialog'))

      expect(screen.getByRole('textbox', { name: /descrição/i })).toBeTruthy()
    })

    it('edit modal Cancel button meets 44px touch target (min-h-[44px])', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /editar papel/i }))
      await user.click(screen.getByRole('button', { name: /editar papel/i }))
      await waitFor(() => screen.getByRole('dialog'))

      expect(screen.getByRole('button', { name: /cancelar/i }).className).toContain('min-h-[44px]')
    })

    it('delete dialog Cancel button meets 44px touch target (min-h-[44px])', async () => {
      const user = userEvent.setup()
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('button', { name: /excluir papel/i }))
      await user.click(screen.getByRole('button', { name: /excluir papel/i }))
      await waitFor(() => screen.getByRole('alertdialog'))

      expect(screen.getByRole('button', { name: /cancelar/i }).className).toContain('min-h-[44px]')
    })

    it('back navigation link is keyboard focusable', async () => {
      renderDetailPage(MOCK_ROLE.id)

      await waitFor(() => screen.getByRole('link', { name: /voltar para lista de papéis/i }))

      const backLink = screen.getByRole('link', { name: /voltar para lista de papéis/i })
      backLink.focus()
      expect(document.activeElement).toBe(backLink)
    })
  })
})

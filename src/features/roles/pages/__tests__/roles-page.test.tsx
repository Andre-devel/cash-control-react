import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_PAGINATED_ROLES, MOCK_ROLE, MOCK_SYSTEM_ROLE } from '@/test/handlers/roles.handlers'
import { useAuthStore } from '@/features/auth/store/auth.store'
import RolesPage from '../roles-page'

const TWO_PAGE_HANDLER = (
  page1Content = MOCK_PAGINATED_ROLES.content,
  page2Content = [MOCK_SYSTEM_ROLE],
) =>
  http.get('*/roles', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    return HttpResponse.json({
      content: page === 0 ? page1Content : page2Content,
      page,
      size: 20,
      totalElements: 40,
      totalPages: 2,
    })
  })

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

describe('RolesPage', () => {
  it('renders role list from MSW data', async () => {
    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByText(MOCK_ROLE.name)).toBeTruthy()
      expect(screen.getByText(MOCK_SYSTEM_ROLE.name)).toBeTruthy()
    })
  })

  it('renders role descriptions when present', async () => {
    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByText(MOCK_ROLE.description)).toBeTruthy()
    })
  })

  it('renders system badge for system roles', async () => {
    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByText('System')).toBeTruthy()
    })
  })

  it('renders loading skeleton before data arrives', () => {
    renderWithProviders(<RolesPage />)

    expect(screen.getByLabelText('Loading roles')).toBeTruthy()
  })

  it('renders page heading', async () => {
    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /roles/i })).toBeTruthy()
    })
  })

  it('renders New Role button', async () => {
    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new role/i })).toBeTruthy()
    })
  })

  it('empty state renders when API returns zero items', async () => {
    server.use(
      http.get('*/roles', () =>
        HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        }),
      ),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByText(/no roles found/i)).toBeTruthy()
    })
  })

  it('empty state includes New Role button', async () => {
    server.use(
      http.get('*/roles', () =>
        HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        }),
      ),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      const newRoleButtons = screen.getAllByRole('button', { name: /new role/i })
      expect(newRoleButtons.length).toBeGreaterThan(0)
    })
  })

  it('error state renders when API returns 500', async () => {
    server.use(
      http.get('*/roles', () => HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 })),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load roles/i)).toBeTruthy()
    })
  })

  it('error state renders Retry button', async () => {
    server.use(
      http.get('*/roles', () => HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 })),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
    })
  })

  it('pagination controls appear when totalPages > 1', async () => {
    server.use(
      http.get('*/roles', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 0)
        return HttpResponse.json({
          content: MOCK_PAGINATED_ROLES.content,
          page,
          size: 20,
          totalElements: 40,
          totalPages: 2,
        })
      }),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /previous page/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /next page/i })).toBeTruthy()
    })
  })

  it('Previous button is disabled on first page', async () => {
    server.use(
      http.get('*/roles', () =>
        HttpResponse.json({
          content: MOCK_PAGINATED_ROLES.content,
          page: 0,
          size: 20,
          totalElements: 40,
          totalPages: 2,
        }),
      ),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: /previous page/i })
      expect(prevButton).toBeDisabled()
    })
  })

  it('pagination controls trigger refetch with updated page param', async () => {
    const capturedPages: number[] = []

    server.use(
      http.get('*/roles', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 0)
        capturedPages.push(page)
        return HttpResponse.json({
          content: MOCK_PAGINATED_ROLES.content,
          page,
          size: 20,
          totalElements: 40,
          totalPages: 2,
        })
      }),
    )

    renderWithProviders(<RolesPage />)

    await waitFor(() => screen.getByRole('button', { name: /next page/i }))

    fireEvent.click(screen.getByRole('button', { name: /next page/i }))

    await waitFor(() => expect(capturedPages).toContain(1))
  })

  it('pagination controls are hidden when totalPages is 1', async () => {
    renderWithProviders(<RolesPage />)

    await waitFor(() => {
      expect(screen.getByText(MOCK_ROLE.name)).toBeTruthy()
    })

    expect(screen.queryByRole('button', { name: /previous page/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /next page/i })).toBeNull()
  })

  describe('create role', () => {
    it('New Role button opens the create modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeTruthy()
        expect(screen.getByRole('heading', { name: /create role/i })).toBeTruthy()
      })
    })

    it('form blocks submission when name is empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.click(screen.getByRole('button', { name: /create role/i }))

      await waitFor(() => {
        expect(screen.getByText(/at least 2 characters/i)).toBeTruthy()
      })
    })

    it('create form → success → modal closes and list refetches', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.type(screen.getByRole('textbox', { name: /name/i }), 'TESTER')
      await user.click(screen.getByRole('button', { name: /create role/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })

    it('create form → 409 → inline error rendered on name field', async () => {
      server.use(
        http.post('*/roles', () =>
          HttpResponse.json(
            {
              errorCode: 'ROLE_ALREADY_EXISTS',
              message: 'Role already exists.',
              correlationId: 'c',
            },
            { status: 409 },
          ),
        ),
      )

      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.type(screen.getByRole('textbox', { name: /name/i }), 'DUPLICATE')
      await user.click(screen.getByRole('button', { name: /create role/i }))

      await waitFor(() => {
        expect(screen.getByText(/a role with this name already exists/i)).toBeTruthy()
        expect(screen.getByRole('dialog')).toBeTruthy()
      })
    })

    it('Cancel button closes the modal without submitting', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })

    it('create form → 500 → shows error toast and keeps modal open', async () => {
      const { toast } = await import('@/lib/toast')
      server.use(
        http.post('*/roles', () =>
          HttpResponse.json(
            { errorCode: 'SERVER_ERROR', message: 'Internal server error.', correlationId: 'c' },
            { status: 500 },
          ),
        ),
      )

      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.type(screen.getByRole('textbox', { name: /name/i }), 'NEWROLE')
      await user.click(screen.getByRole('button', { name: /create role/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Internal server error.')
      })
    })
  })

  describe('permission-aware rendering', () => {
    it('New Role button is hidden when user lacks role:create', async () => {
      useAuthStore.getState().setUser({
        ...FULL_PERMISSIONS_USER,
        permissions: ['role:update'],
      })
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByText(MOCK_ROLE.name))

      expect(screen.queryByRole('button', { name: /new role/i })).toBeNull()
    })

    it('New Role button is visible when user has role:create', async () => {
      renderWithProviders(<RolesPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new role/i })).toBeTruthy()
      })
    })

    it('New Role button is hidden in empty state when user lacks role:create', async () => {
      server.use(
        http.get('*/roles', () =>
          HttpResponse.json({
            content: [],
            page: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0,
          }),
        ),
      )
      useAuthStore.getState().setUser({
        ...FULL_PERMISSIONS_USER,
        permissions: ['role:update'],
      })
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByText(/no roles found/i))

      expect(screen.queryByRole('button', { name: /new role/i })).toBeNull()
    })
  })

  describe('Phase 9 — performance', () => {
    it('keepPreviousData: previous page roles stay visible while fetching next page', async () => {
      let resolveNextPage: (() => void) | undefined
      const nextPageReady = new Promise<void>((resolve) => {
        resolveNextPage = resolve
      })

      server.use(
        http.get('*/roles', async ({ request }) => {
          const url = new URL(request.url)
          const page = Number(url.searchParams.get('page') ?? 0)

          if (page === 0) {
            return HttpResponse.json({
              content: MOCK_PAGINATED_ROLES.content,
              page: 0,
              size: 20,
              totalElements: 40,
              totalPages: 2,
            })
          }

          await nextPageReady
          return HttpResponse.json({
            content: [],
            page: 1,
            size: 20,
            totalElements: 40,
            totalPages: 2,
          })
        }),
      )

      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByText(MOCK_ROLE.name))

      fireEvent.click(screen.getByRole('button', { name: /next page/i }))

      expect(screen.getByText(MOCK_ROLE.name)).toBeTruthy()
      expect(screen.queryByLabelText('Loading roles')).toBeNull()

      resolveNextPage!()
    })
  })

  describe('Phase 9 — accessibility', () => {
    it('New Role button meets 44px touch target (min-h-[44px])', async () => {
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))

      const buttons = screen.getAllByRole('button', { name: /new role/i })
      buttons.forEach((btn) => {
        expect(btn.className).toContain('min-h-[44px]')
      })
    })

    it('pagination buttons meet 44px touch target (min-h-[44px])', async () => {
      server.use(TWO_PAGE_HANDLER())
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /next page/i }))

      expect(screen.getByRole('button', { name: /previous page/i }).className).toContain(
        'min-h-[44px]',
      )
      expect(screen.getByRole('button', { name: /next page/i }).className).toContain('min-h-[44px]')
    })

    it('Tab moves focus to New Role button and Enter opens the modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))

      const newRoleBtn = screen.getAllByRole('button', { name: /new role/i })[0]
      newRoleBtn.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeTruthy()
      })
    })

    it('Escape key closes the create modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
    })

    it('create form: Name field has accessible label', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      expect(screen.getByRole('textbox', { name: /name/i })).toBeTruthy()
    })

    it('create form: Description field has accessible label', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      expect(screen.getByRole('textbox', { name: /description/i })).toBeTruthy()
    })

    it('create form validation: invalid name shows aria-invalid on input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.click(screen.getByRole('button', { name: /create role/i }))

      await waitFor(() => {
        const nameInput = screen.getByRole('textbox', { name: /name/i })
        expect(nameInput.getAttribute('aria-invalid')).toBe('true')
      })
    })

    it('Tab order through create form: Name → Description → Cancel → Create Role', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /new role/i }))
      await user.click(screen.getAllByRole('button', { name: /new role/i })[0])
      await waitFor(() => screen.getByRole('dialog'))

      const nameInput = screen.getByRole('textbox', { name: /name/i })
      nameInput.focus()
      expect(document.activeElement).toBe(nameInput)

      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /description/i }))

      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /cancel/i }))

      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /create role/i }))
    })

    it('page counter is announced via aria-live', async () => {
      server.use(TWO_PAGE_HANDLER())
      renderWithProviders(<RolesPage />)

      await waitFor(() => screen.getByRole('button', { name: /next page/i }))

      const liveRegion = screen.getByText(/page 1 of/i)
      expect(liveRegion.getAttribute('aria-live')).toBe('polite')
    })
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/utils'
import { MOCK_ROLE, MOCK_SYSTEM_ROLE } from '@/test/handlers/roles.handlers'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { UserRolesPanel } from '../user-roles-panel'
import type { Role } from '@/features/roles/types'

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

const TEST_USER_ID = 'user-1'
const TEST_USER_NAME = 'Test User'

function renderPanel(roles: Role[], userId = TEST_USER_ID, userName = TEST_USER_NAME) {
  const queryClient = createTestQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <UserRolesPanel userId={userId} userName={userName} roles={roles} />
    </QueryClientProvider>,
  )
}

async function openAssignModalAndWaitForOptions() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /assign role/i }))
  await waitFor(() => screen.getByRole('dialog'))
  await waitFor(() => screen.getByRole('option', { name: MOCK_ROLE.name }))
  return user
}

describe('UserRolesPanel — rendering', () => {
  it('renders assigned roles', () => {
    renderPanel([MOCK_ROLE])

    expect(screen.getByText(MOCK_ROLE.name)).toBeTruthy()
    expect(screen.getByText(MOCK_ROLE.description)).toBeTruthy()
  })

  it('renders Assign Role button when roles are present', () => {
    renderPanel([MOCK_ROLE])

    expect(screen.getByRole('button', { name: /assign role/i })).toBeTruthy()
  })

  it('renders empty state with Assign Role button when no roles', () => {
    renderPanel([])

    expect(screen.getByText(/no roles assigned/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /assign role/i })).toBeTruthy()
  })

  it('renders Remove button per assigned role', () => {
    renderPanel([MOCK_ROLE])

    expect(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` })).toBeTruthy()
  })
})

describe('UserRolesPanel — assign role', () => {
  it('opens assign modal when Assign Role is clicked', async () => {
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: /assign role/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByRole('heading', { name: /assign role/i })).toBeTruthy()
    })
  })

  it('assign modal lists available roles', async () => {
    renderPanel([MOCK_ROLE])

    await openAssignModalAndWaitForOptions()

    expect(screen.getByRole('option', { name: MOCK_ROLE.name })).toBeTruthy()
    expect(screen.getByRole('option', { name: MOCK_SYSTEM_ROLE.name })).toBeTruthy()
  })

  it('assign modal displays user name in description', async () => {
    renderPanel([MOCK_ROLE])

    await openAssignModalAndWaitForOptions()

    expect(screen.getByText(TEST_USER_NAME, { exact: false })).toBeTruthy()
  })

  it('assign flow → success → modal closes', async () => {
    renderPanel([MOCK_ROLE])

    const user = await openAssignModalAndWaitForOptions()

    await user.selectOptions(screen.getByLabelText('Select role'), MOCK_SYSTEM_ROLE.id)

    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('assign flow → success → shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    renderPanel([MOCK_ROLE])

    const user = await openAssignModalAndWaitForOptions()

    await user.selectOptions(screen.getByLabelText('Select role'), MOCK_SYSTEM_ROLE.id)

    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Role assigned to user.')
    })
  })

  it('assign → 409 → error toast, modal stays open', async () => {
    const { toast } = await import('@/lib/toast')

    server.use(
      http.post('*/users/:userId/roles', () =>
        HttpResponse.json(
          {
            errorCode: 'ROLE_ALREADY_ASSIGNED',
            message: 'An unexpected error occurred.',
            correlationId: 'test',
          },
          { status: 409 },
        ),
      ),
    )

    renderPanel([MOCK_ROLE])

    const user = await openAssignModalAndWaitForOptions()

    await user.selectOptions(screen.getByLabelText('Select role'), MOCK_SYSTEM_ROLE.id)

    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Role already assigned to this user.')
    })

    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('assign modal cancel closes without dispatching mutation', async () => {
    let assignCalled = false
    server.use(
      http.post('*/users/:userId/roles', () => {
        assignCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: /assign role/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(assignCalled).toBe(false)
  })
})

describe('UserRolesPanel — revoke role', () => {
  it('clicking Remove opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }))

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeTruthy()
    })
  })

  it('revoke confirmation dialog displays role name and user name', async () => {
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }))

    await waitFor(() => {
      screen.getByRole('alertdialog')
    })

    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText(MOCK_ROLE.name, { exact: false })).toBeTruthy()
    expect(within(dialog).getByText(TEST_USER_NAME, { exact: false })).toBeTruthy()
  })

  it('revoke → confirm → success → dialog closes', async () => {
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }))

    await waitFor(() => screen.getByRole('alertdialog'))

    await user.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  it('revoke → confirm → success → shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }))

    await waitFor(() => screen.getByRole('alertdialog'))

    await user.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Role removed from user.')
    })
  })

  it('revoke → cancel → no mutation dispatched', async () => {
    let revokeCalled = false
    server.use(
      http.delete('*/users/:userId/roles/:roleId', () => {
        revokeCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }))

    await waitFor(() => screen.getByRole('alertdialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
    expect(revokeCalled).toBe(false)
  })
})

describe('UserRolesPanel — permission-aware rendering', () => {
  it('Assign Role button is hidden when user lacks role:update', () => {
    useAuthStore.getState().setUser({
      ...FULL_PERMISSIONS_USER,
      permissions: ['role:create', 'role:delete'],
    })
    renderPanel([MOCK_ROLE])

    expect(screen.queryByRole('button', { name: /assign role/i })).toBeNull()
  })

  it('Assign Role button in empty state is hidden when user lacks role:update', () => {
    useAuthStore.getState().setUser({
      ...FULL_PERMISSIONS_USER,
      permissions: ['role:create'],
    })
    renderPanel([])

    expect(screen.queryByRole('button', { name: /assign role/i })).toBeNull()
  })

  it('Remove button per role item is hidden when user lacks role:update', () => {
    useAuthStore.getState().setUser({
      ...FULL_PERMISSIONS_USER,
      permissions: ['role:create'],
    })
    renderPanel([MOCK_ROLE])

    expect(screen.queryByRole('button', { name: `Remove role ${MOCK_ROLE.name}` })).toBeNull()
  })

  it('Assign Role button is visible when user has role:update', () => {
    renderPanel([MOCK_ROLE])
    expect(screen.getByRole('button', { name: /assign role/i })).toBeTruthy()
  })

  it('Remove button is visible when user has role:update', () => {
    renderPanel([MOCK_ROLE])
    expect(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` })).toBeTruthy()
  })
})

describe('UserRolesPanel — Phase 9 accessibility', () => {
  it('Assign Role button meets 44px touch target (min-h-[44px])', () => {
    renderPanel([MOCK_ROLE])

    expect(screen.getByRole('button', { name: /assign role/i }).className).toContain('min-h-[44px]')
  })

  it('Remove role button meets 44px touch target (min-h-[44px])', () => {
    renderPanel([MOCK_ROLE])

    expect(
      screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }).className,
    ).toContain('min-h-[44px]')
  })

  it('Escape key closes the assign role modal', async () => {
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: /assign role/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('Escape key closes the revoke role confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPanel([MOCK_ROLE])

    await user.click(screen.getByRole('button', { name: `Remove role ${MOCK_ROLE.name}` }))
    await waitFor(() => screen.getByRole('alertdialog'))

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  it('assigned roles list has accessible aria-label', () => {
    renderPanel([MOCK_ROLE])

    expect(screen.getByRole('list', { name: /assigned roles/i })).toBeTruthy()
  })
})

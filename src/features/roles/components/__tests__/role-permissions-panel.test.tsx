import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/utils'
import {
  MOCK_ROLE,
  MOCK_SYSTEM_ROLE,
  MOCK_PERMISSION,
  MOCK_PERMISSION_2,
} from '@/test/handlers/roles.handlers'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { RolePermissionsPanel } from '../role-permissions-panel'
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

function renderPanel(role: Role) {
  const queryClient = createTestQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <RolePermissionsPanel role={role} />
    </QueryClientProvider>,
  )
}

async function openAssignModalAndWaitForOptions() {
  const user = userEvent.setup()
  await waitFor(() => screen.getByRole('button', { name: /assign permission/i }))
  await user.click(screen.getByRole('button', { name: /assign permission/i }))
  await waitFor(() => screen.getByRole('dialog'))
  // Wait for the permissions list to load in the select
  await waitFor(() => screen.getByRole('option', { name: MOCK_PERMISSION_2.name }))
  return user
}

describe('RolePermissionsPanel — rendering', () => {
  it('renders assigned permissions', async () => {
    renderPanel(MOCK_ROLE)

    await waitFor(() => {
      expect(screen.getByText(MOCK_PERMISSION.name)).toBeTruthy()
      expect(screen.getByText(MOCK_PERMISSION.description)).toBeTruthy()
    })
  })

  it('renders Assign Permission button when permissions are present', async () => {
    renderPanel(MOCK_ROLE)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /assign permission/i })).toBeTruthy()
    })
  })

  it('renders empty state with Assign Permission button when no permissions', async () => {
    renderPanel(MOCK_SYSTEM_ROLE)

    await waitFor(() => {
      expect(screen.getByText(/no permissions assigned/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /assign permission/i })).toBeTruthy()
    })
  })

  it('renders Remove button per assigned permission', async () => {
    renderPanel(MOCK_ROLE)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
      ).toBeTruthy()
    })
  })
})

describe('RolePermissionsPanel — assign permission', () => {
  it('opens assign modal when Assign Permission is clicked', async () => {
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() => screen.getByRole('button', { name: /assign permission/i }))
    await user.click(screen.getByRole('button', { name: /assign permission/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByRole('heading', { name: /assign permission/i })).toBeTruthy()
    })
  })

  it('assign modal lists available permissions', async () => {
    renderPanel(MOCK_ROLE)

    await openAssignModalAndWaitForOptions()

    expect(screen.getByRole('option', { name: MOCK_PERMISSION.name })).toBeTruthy()
    expect(screen.getByRole('option', { name: MOCK_PERMISSION_2.name })).toBeTruthy()
  })

  it('assign flow → success → modal closes', async () => {
    renderPanel(MOCK_ROLE)

    const user = await openAssignModalAndWaitForOptions()

    await user.selectOptions(screen.getByLabelText('Select permission'), MOCK_PERMISSION_2.id)

    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('assign flow → success → shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    renderPanel(MOCK_ROLE)

    const user = await openAssignModalAndWaitForOptions()

    await user.selectOptions(screen.getByLabelText('Select permission'), MOCK_PERMISSION_2.id)

    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Permission assigned to role.')
    })
  })

  it('assign → 409 → error toast, modal stays open', async () => {
    const { toast } = await import('@/lib/toast')

    server.use(
      http.post('*/roles/:roleId/permissions', () =>
        HttpResponse.json(
          {
            errorCode: 'PERMISSION_ALREADY_ASSIGNED',
            message: 'An unexpected error occurred.',
            correlationId: 'test',
          },
          { status: 409 },
        ),
      ),
    )

    renderPanel(MOCK_ROLE)

    const user = await openAssignModalAndWaitForOptions()

    await user.selectOptions(screen.getByLabelText('Select permission'), MOCK_PERMISSION_2.id)

    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Permission already assigned to this role.')
    })

    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('assign modal cancel closes without dispatching mutation', async () => {
    let assignCalled = false
    server.use(
      http.post('*/roles/:roleId/permissions', () => {
        assignCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() => screen.getByRole('button', { name: /assign permission/i }))
    await user.click(screen.getByRole('button', { name: /assign permission/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(assignCalled).toBe(false)
  })
})

describe('RolePermissionsPanel — revoke permission', () => {
  it('clicking Remove opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() =>
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeTruthy()
    })
  })

  it('revoke confirmation dialog displays permission name and role name', async () => {
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() =>
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )

    await waitFor(() => {
      screen.getByRole('alertdialog')
    })

    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText(MOCK_PERMISSION.name, { exact: false })).toBeTruthy()
    expect(within(dialog).getByText(MOCK_ROLE.name, { exact: false })).toBeTruthy()
  })

  it('revoke → confirm → success → dialog closes', async () => {
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() =>
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )

    await waitFor(() => screen.getByRole('alertdialog'))

    await user.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  it('revoke → confirm → success → shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() =>
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )

    await waitFor(() => screen.getByRole('alertdialog'))

    await user.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Permission removed from role.')
    })
  })

  it('revoke → cancel → no mutation dispatched', async () => {
    let revokeCalled = false
    server.use(
      http.delete('*/roles/:roleId/permissions/:permissionId', () => {
        revokeCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() =>
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )

    await waitFor(() => screen.getByRole('alertdialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
    expect(revokeCalled).toBe(false)
  })
})

describe('RolePermissionsPanel — permission-aware rendering', () => {
  it('Assign Permission button is hidden when user lacks permission:grant', () => {
    useAuthStore.getState().setUser({
      ...FULL_PERMISSIONS_USER,
      permissions: ['permission:revoke'],
    })
    renderPanel(MOCK_ROLE)

    expect(screen.queryByRole('button', { name: /assign permission/i })).toBeNull()
  })

  it('Assign Permission button in empty state is hidden when user lacks permission:grant', () => {
    useAuthStore.getState().setUser({
      ...FULL_PERMISSIONS_USER,
      permissions: ['permission:revoke'],
    })
    renderPanel(MOCK_SYSTEM_ROLE)

    expect(screen.queryByRole('button', { name: /assign permission/i })).toBeNull()
  })

  it('Remove button per permission is hidden when user lacks permission:revoke', () => {
    useAuthStore.getState().setUser({
      ...FULL_PERMISSIONS_USER,
      permissions: ['permission:grant'],
    })
    renderPanel(MOCK_ROLE)

    expect(
      screen.queryByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    ).toBeNull()
  })

  it('Assign Permission button is visible when user has permission:grant', async () => {
    renderPanel(MOCK_ROLE)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /assign permission/i })).toBeTruthy()
    })
  })

  it('Remove button is visible when user has permission:revoke', async () => {
    renderPanel(MOCK_ROLE)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
      ).toBeTruthy()
    })
  })
})

describe('RolePermissionsPanel — Phase 9 accessibility', () => {
  it('Assign Permission button meets 44px touch target (min-h-[44px])', async () => {
    renderPanel(MOCK_ROLE)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /assign permission/i }).className).toContain(
        'min-h-[44px]',
      )
    })
  })

  it('Remove button per permission meets 44px touch target (min-h-[44px])', async () => {
    renderPanel(MOCK_ROLE)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }).className,
      ).toContain('min-h-[44px]')
    })
  })

  it('Escape key closes the assign permission modal', async () => {
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() => screen.getByRole('button', { name: /assign permission/i }))
    await user.click(screen.getByRole('button', { name: /assign permission/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('Escape key closes the revoke permission confirmation dialog', async () => {
    const user = userEvent.setup()
    renderPanel(MOCK_ROLE)

    await waitFor(() =>
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Remove permission ${MOCK_PERMISSION.name}` }),
    )
    await waitFor(() => screen.getByRole('alertdialog'))

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  it('permission list has accessible aria-label', async () => {
    renderPanel(MOCK_ROLE)

    await waitFor(() => {
      expect(screen.getByRole('list', { name: /assigned permissions/i })).toBeTruthy()
    })
  })
})

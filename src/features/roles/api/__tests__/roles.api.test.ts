import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import {
  getRoles,
  getRoleById,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  revokePermissionFromRole,
  assignRoleToUser,
  revokeRoleFromUser,
} from '../roles.api'
import { MOCK_ROLE, MOCK_PAGINATED_ROLES, MOCK_PERMISSION } from '@/test/handlers/roles.handlers'

beforeEach(() => {
  server.resetHandlers()
})

describe('getRoles', () => {
  it('calls GET /roles with pagination params', async () => {
    const result = await getRoles({ page: 0, size: 20 })
    expect(result.content).toHaveLength(MOCK_PAGINATED_ROLES.content.length)
    expect(result.page).toBe(0)
    expect(result.size).toBe(20)
  })

  it('passes page and size as query params', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/roles', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(MOCK_PAGINATED_ROLES)
      }),
    )
    await getRoles({ page: 2, size: 10 })
    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('size')).toBe('10')
  })
})

describe('getRoleById', () => {
  it('calls GET /roles/:roleId and returns role data', async () => {
    const result = await getRoleById(MOCK_ROLE.id)
    expect(result.id).toBe(MOCK_ROLE.id)
    expect(result.name).toBe(MOCK_ROLE.name)
    expect(result.systemRole).toBe(MOCK_ROLE.systemRole)
    expect(result.permissionCount).toBe(MOCK_ROLE.permissionCount)
  })

  it('rejects on 404 for unknown role', async () => {
    await expect(getRoleById('not-found')).rejects.toMatchObject({ status: 404 })
  })
})

describe('getRolePermissions', () => {
  it('calls GET /roles/:roleId/permissions and returns permission array', async () => {
    const result = await getRolePermissions(MOCK_ROLE.id)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(MOCK_PERMISSION.id)
    expect(result[0].name).toBe(MOCK_PERMISSION.name)
  })

  it('returns empty array for role with no permissions', async () => {
    const result = await getRolePermissions('role-system-1')
    expect(result).toHaveLength(0)
  })
})

describe('createRole', () => {
  it('calls POST /roles with correct payload and returns created role', async () => {
    const result = await createRole({ name: 'MODERATOR', description: 'Test role' })
    expect(result.name).toBe('MODERATOR')
    expect(result.systemRole).toBe(false)
  })

  it('rejects with 409 when role name already exists', async () => {
    await expect(createRole({ name: 'DUPLICATE' })).rejects.toMatchObject({ status: 409 })
  })
})

describe('updateRole', () => {
  it('calls PUT /roles/:roleId and resolves', async () => {
    await expect(
      updateRole(MOCK_ROLE.id, { description: 'Updated description' }),
    ).resolves.toBeUndefined()
  })
})

describe('deleteRole', () => {
  it('calls DELETE /roles/:roleId and resolves', async () => {
    await expect(deleteRole(MOCK_ROLE.id)).resolves.toBeUndefined()
  })

  it('rejects with 409 when role is in use', async () => {
    await expect(deleteRole('role-in-use')).rejects.toMatchObject({ status: 409 })
  })
})

describe('assignPermissionToRole', () => {
  it('calls POST /roles/:roleId/permissions and resolves', async () => {
    let capturedBody: unknown
    server.use(
      http.post('*/roles/:roleId/permissions', async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await assignPermissionToRole(MOCK_ROLE.id, 'perm-new')
    expect(capturedBody).toEqual({ permissionId: 'perm-new' })
  })

  it('rejects with 409 when permission already assigned', async () => {
    await expect(
      assignPermissionToRole(MOCK_ROLE.id, 'perm-already-assigned'),
    ).rejects.toMatchObject({ status: 409 })
  })
})

describe('revokePermissionFromRole', () => {
  it('calls DELETE /roles/:roleId/permissions/:permissionId and resolves', async () => {
    await expect(revokePermissionFromRole(MOCK_ROLE.id, 'perm-1')).resolves.toBeUndefined()
  })
})

describe('assignRoleToUser', () => {
  it('calls POST /users/:userId/roles with correct payload', async () => {
    let capturedBody: unknown
    server.use(
      http.post('*/users/:userId/roles', async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await assignRoleToUser('user-1', 'role-1')
    expect(capturedBody).toEqual({ roleId: 'role-1' })
  })

  it('rejects with 409 when role already assigned to user', async () => {
    server.use(
      http.post('*/users/:userId/roles', () =>
        HttpResponse.json(
          {
            errorCode: 'ROLE_ALREADY_ASSIGNED',
            message: 'An unexpected error occurred.',
            correlationId: 'test-id',
          },
          { status: 409 },
        ),
      ),
    )
    await expect(assignRoleToUser('user-1', 'role-1')).rejects.toMatchObject({ status: 409 })
  })
})

describe('revokeRoleFromUser', () => {
  it('calls DELETE /users/:userId/roles/:roleId and resolves', async () => {
    await expect(revokeRoleFromUser('user-1', 'role-1')).resolves.toBeUndefined()
  })
})

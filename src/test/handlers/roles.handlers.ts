import { http, HttpResponse } from 'msw'
import type { Permission, Role, PaginatedRoles, PaginatedPermissions } from '@/features/roles/types'

export const MOCK_PERMISSION: Permission = {
  id: 'perm-1',
  name: 'report:view',
  description: 'Visualizar relatórios',
}

export const MOCK_PERMISSION_2: Permission = {
  id: 'perm-2',
  name: 'user:write',
  description: 'Escrever usuários',
}

export const MOCK_PERMISSIONS: Permission[] = [MOCK_PERMISSION, MOCK_PERMISSION_2]

export const MOCK_PAGINATED_PERMISSIONS: PaginatedPermissions = {
  content: MOCK_PERMISSIONS,
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
}

export const MOCK_ROLE: Role = {
  id: 'role-1',
  name: 'MODERATOR',
  description: 'Papel de moderação de conteúdo',
  systemRole: false,
  permissionCount: 1,
  createdAt: '2024-01-01T00:00:00Z',
}

export const MOCK_SYSTEM_ROLE: Role = {
  id: 'role-system-1',
  name: 'ADMIN',
  description: 'Papel de administrador',
  systemRole: true,
  permissionCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
}

export const MOCK_PAGINATED_ROLES: PaginatedRoles = {
  content: [MOCK_ROLE, MOCK_SYSTEM_ROLE],
  page: 0,
  size: 20,
  totalElements: 2,
  totalPages: 1,
}

export const rolesHandlers = [
  http.get('*/roles/:roleId/permissions', ({ params }) => {
    if (params.roleId === MOCK_ROLE.id) {
      return HttpResponse.json([MOCK_PERMISSION])
    }
    return HttpResponse.json([])
  }),

  http.get('*/permissions', () => {
    return HttpResponse.json(MOCK_PAGINATED_PERMISSIONS)
  }),

  http.get('*/roles', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    return HttpResponse.json({ ...MOCK_PAGINATED_ROLES, page, size })
  }),

  http.get('*/roles/:roleId', ({ params }) => {
    if (params.roleId === 'not-found') {
      return HttpResponse.json(
        {
          errorCode: 'ROLE_NOT_FOUND',
          message: 'An unexpected error occurred.',
          correlationId: 'test-correlation-id',
        },
        { status: 404 },
      )
    }
    if (params.roleId === MOCK_SYSTEM_ROLE.id) {
      return HttpResponse.json(MOCK_SYSTEM_ROLE)
    }
    return HttpResponse.json(MOCK_ROLE)
  }),

  http.post('*/roles', async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string }
    if (body.name === 'DUPLICATE') {
      return HttpResponse.json(
        {
          errorCode: 'ROLE_ALREADY_EXISTS',
          message: 'An unexpected error occurred.',
          correlationId: 'test-correlation-id',
        },
        { status: 409 },
      )
    }
    const created: Role = {
      id: 'role-new',
      name: body.name,
      description: body.description ?? '',
      systemRole: false,
      permissionCount: 0,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/roles/:roleId', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('*/roles/:roleId', ({ params }) => {
    if (params.roleId === 'role-in-use') {
      return HttpResponse.json(
        {
          errorCode: 'ROLE_IN_USE',
          message: 'An unexpected error occurred.',
          correlationId: 'test-correlation-id',
        },
        { status: 409 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/roles/:roleId/permissions', async ({ request }) => {
    const body = (await request.json()) as { permissionId: string }
    if (body.permissionId === 'perm-already-assigned') {
      return HttpResponse.json(
        {
          errorCode: 'PERMISSION_ALREADY_ASSIGNED',
          message: 'An unexpected error occurred.',
          correlationId: 'test-correlation-id',
        },
        { status: 409 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('*/roles/:roleId/permissions/:permissionId', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/users/:userId/roles', async ({ request }) => {
    const body = (await request.json()) as { roleId: string }
    if (body.roleId === 'role-already-assigned') {
      return HttpResponse.json(
        {
          errorCode: 'ROLE_ALREADY_ASSIGNED',
          message: 'An unexpected error occurred.',
          correlationId: 'test-correlation-id',
        },
        { status: 409 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('*/users/:userId/roles/:roleId', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

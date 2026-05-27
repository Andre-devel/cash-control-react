export interface Permission {
  id: string
  name: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  systemRole: boolean
  permissionCount: number
  createdAt: string
}

export interface PaginatedRoles {
  content: Role[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PaginatedPermissions {
  content: Permission[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PaginationParams {
  page: number
  size: number
}

export interface CreateRolePayload {
  name: string
  description?: string
}

export interface UpdateRolePayload {
  description?: string
}

export interface AssignPermissionPayload {
  permissionId: string
}

export interface AssignRolePayload {
  roleId: string
}

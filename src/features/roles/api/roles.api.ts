import { axiosInstance } from '@/services/http'
import type {
  PaginatedRoles,
  PaginatedPermissions,
  PaginationParams,
  Permission,
  Role,
  CreateRolePayload,
  UpdateRolePayload,
} from '@/features/roles/types'

export async function getRoles(params: PaginationParams): Promise<PaginatedRoles> {
  const response = await axiosInstance.get<PaginatedRoles>('/roles', { params })
  return response.data
}

export async function getRoleById(roleId: string): Promise<Role> {
  const response = await axiosInstance.get<Role>(`/roles/${roleId}`)
  return response.data
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const response = await axiosInstance.post<Role>('/roles', payload)
  return response.data
}

export async function updateRole(roleId: string, payload: UpdateRolePayload): Promise<void> {
  await axiosInstance.put(`/roles/${roleId}`, payload)
}

export async function deleteRole(roleId: string): Promise<void> {
  await axiosInstance.delete(`/roles/${roleId}`)
}

export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
  await axiosInstance.post(`/roles/${roleId}/permissions`, { permissionId })
}

export async function revokePermissionFromRole(
  roleId: string,
  permissionId: string,
): Promise<void> {
  await axiosInstance.delete(`/roles/${roleId}/permissions/${permissionId}`)
}

export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  await axiosInstance.post(`/users/${userId}/roles`, { roleId })
}

export async function revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
  await axiosInstance.delete(`/users/${userId}/roles/${roleId}`)
}

export async function getPermissions(): Promise<Permission[]> {
  const response = await axiosInstance.get<PaginatedPermissions>('/permissions')
  return response.data.content
}

export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  const response = await axiosInstance.get<Permission[]>(`/roles/${roleId}/permissions`)
  return response.data
}

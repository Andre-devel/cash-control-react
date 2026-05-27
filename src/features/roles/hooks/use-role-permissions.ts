import { useAuthStore } from '@/features/auth/store/auth.store'

export function useRolePermissions() {
  const user = useAuthStore((s) => s.user)
  const permissions = user?.permissions ?? []

  return {
    canCreateRole: permissions.includes('role:create'),
    canUpdateRole: permissions.includes('role:update'),
    canDeleteRole: permissions.includes('role:delete'),
    canGrantPermission: permissions.includes('permission:grant'),
    canRevokePermission: permissions.includes('permission:revoke'),
  }
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRolePermissions } from '../use-role-permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

function setPermissions(permissions: string[]) {
  useAuthStore.getState().setUser({
    id: 'u1',
    email: 'admin@example.com',
    name: 'Admin',
    roles: ['ADMIN'],
    permissions,
  })
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  useAuthStore.getState().clearSession()
})

describe('useRolePermissions', () => {
  it('returns all false when user has no permissions', () => {
    const { result } = renderHook(() => useRolePermissions())

    expect(result.current.canCreateRole).toBe(false)
    expect(result.current.canUpdateRole).toBe(false)
    expect(result.current.canDeleteRole).toBe(false)
    expect(result.current.canGrantPermission).toBe(false)
    expect(result.current.canRevokePermission).toBe(false)
  })

  it('returns canCreateRole: true when role:create is present', () => {
    setPermissions(['role:create'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canCreateRole).toBe(true)
  })

  it('returns canCreateRole: false when role:create is absent', () => {
    setPermissions(['role:update', 'role:delete'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canCreateRole).toBe(false)
  })

  it('returns canUpdateRole: true when role:update is present', () => {
    setPermissions(['role:update'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canUpdateRole).toBe(true)
  })

  it('returns canUpdateRole: false when role:update is absent', () => {
    setPermissions(['role:create'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canUpdateRole).toBe(false)
  })

  it('returns canDeleteRole: true when role:delete is present', () => {
    setPermissions(['role:delete'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canDeleteRole).toBe(true)
  })

  it('returns canDeleteRole: false when role:delete is absent', () => {
    setPermissions(['role:create', 'role:update'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canDeleteRole).toBe(false)
  })

  it('returns canGrantPermission: true when permission:grant is present', () => {
    setPermissions(['permission:grant'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canGrantPermission).toBe(true)
  })

  it('returns canGrantPermission: false when permission:grant is absent', () => {
    setPermissions(['role:create'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canGrantPermission).toBe(false)
  })

  it('returns canRevokePermission: true when permission:revoke is present', () => {
    setPermissions(['permission:revoke'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canRevokePermission).toBe(true)
  })

  it('returns canRevokePermission: false when permission:revoke is absent', () => {
    setPermissions(['permission:grant'])
    const { result } = renderHook(() => useRolePermissions())
    expect(result.current.canRevokePermission).toBe(false)
  })

  it('returns all true when user has all permissions', () => {
    setPermissions([
      'role:create',
      'role:update',
      'role:delete',
      'permission:grant',
      'permission:revoke',
    ])
    const { result } = renderHook(() => useRolePermissions())

    expect(result.current.canCreateRole).toBe(true)
    expect(result.current.canUpdateRole).toBe(true)
    expect(result.current.canDeleteRole).toBe(true)
    expect(result.current.canGrantPermission).toBe(true)
    expect(result.current.canRevokePermission).toBe(true)
  })

  it('returns all false when user is not set', () => {
    const { result } = renderHook(() => useRolePermissions())

    expect(result.current.canCreateRole).toBe(false)
    expect(result.current.canUpdateRole).toBe(false)
    expect(result.current.canDeleteRole).toBe(false)
    expect(result.current.canGrantPermission).toBe(false)
    expect(result.current.canRevokePermission).toBe(false)
  })

  it('returns all false when user has empty permissions array', () => {
    setPermissions([])
    const { result } = renderHook(() => useRolePermissions())

    expect(result.current.canCreateRole).toBe(false)
    expect(result.current.canGrantPermission).toBe(false)
  })
})

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import type { Role, Permission } from '@/features/roles/types'
import {
  useAssignPermissionToRole,
  useRevokePermissionFromRole,
  usePermissions,
  useRolePermissions,
  useRolePermissionsList,
} from '@/features/roles/hooks'

interface RolePermissionsPanelProps {
  role: Role
}

export function RolePermissionsPanel({ role }: RolePermissionsPanelProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedPermissionId, setSelectedPermissionId] = useState('')
  const [permissionToRevoke, setPermissionToRevoke] = useState<Permission | null>(null)

  const { canGrantPermission, canRevokePermission } = useRolePermissions()
  const { data: permissions = [], isLoading: isLoadingRolePermissions } = useRolePermissionsList(
    role.id,
  )
  const { data: availablePermissions = [], isLoading: isLoadingPermissions } = usePermissions()

  const assignPermission = useAssignPermissionToRole({
    onSuccess: () => {
      setIsAssignOpen(false)
      setSelectedPermissionId('')
    },
  })

  const revokePermission = useRevokePermissionFromRole({
    onSuccess: () => setPermissionToRevoke(null),
  })

  function handleAssignClose() {
    setIsAssignOpen(false)
    setSelectedPermissionId('')
  }

  function handleAssign() {
    if (!selectedPermissionId) return
    assignPermission.mutate({ roleId: role.id, permissionId: selectedPermissionId })
  }

  function handleRevoke() {
    if (!permissionToRevoke) return
    revokePermission.mutate({ roleId: role.id, permissionId: permissionToRevoke.id })
  }

  if (isLoadingRolePermissions) {
    return (
      <div
        className="h-20 rounded bg-muted animate-pulse"
        aria-busy="true"
        aria-label="Loading permissions"
      />
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Permissions</h3>
          {canGrantPermission && permissions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              onClick={() => setIsAssignOpen(true)}
              aria-label="Assign permission"
            >
              Assign Permission
            </Button>
          )}
        </div>

        {permissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">No permissions assigned.</p>
            {canGrantPermission && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsAssignOpen(true)}
                aria-label="Assign permission"
              >
                Assign Permission
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Assigned permissions">
            {permissions.map((permission) => (
              <li
                key={permission.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{permission.name}</p>
                  {permission.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {permission.description}
                    </p>
                  )}
                </div>
                {canRevokePermission && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 shrink-0 min-h-[44px] text-destructive hover:text-destructive"
                    aria-label={`Remove permission ${permission.name}`}
                    onClick={() => setPermissionToRevoke(permission)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAssignOpen && (
        <Modal
          title="Assign Permission"
          subtitle={`Select a permission to assign to ${role.name}.`}
          onClose={handleAssignClose}
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={handleAssignClose}
                disabled={assignPermission.isPending}
              >
                Cancel
              </Button>
              <div className="spacer" />
              <Button
                variant="primary"
                size="lg"
                onClick={handleAssign}
                disabled={!selectedPermissionId || assignPermission.isPending}
                aria-busy={assignPermission.isPending}
              >
                {assignPermission.isPending ? (
                  <>
                    <span
                      className="animate-spin"
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                    Assigning…
                  </>
                ) : (
                  'Assign'
                )}
              </Button>
            </>
          }
        >
          <div>
            {isLoadingPermissions ? (
              <p className="text-sm text-muted-foreground">Loading permissions…</p>
            ) : (
              <Select
                value={selectedPermissionId}
                onChange={(e) => setSelectedPermissionId(e.target.value)}
                aria-label="Select permission"
              >
                <option value="">Select a permission…</option>
                {availablePermissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Modal>
      )}

      {permissionToRevoke !== null && (
        <Modal
          alert
          title="Remove Permission"
          subtitle={`Remove ${permissionToRevoke.name} from ${role.name}? This action cannot be undone.`}
          onClose={() => setPermissionToRevoke(null)}
          footer={
            <>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                onClick={() => setPermissionToRevoke(null)}
                disabled={revokePermission.isPending}
              >
                Cancel
              </Button>
              <div className="spacer" />
              <Button
                variant="danger"
                className="min-h-[44px]"
                onClick={handleRevoke}
                disabled={revokePermission.isPending}
                aria-busy={revokePermission.isPending}
              >
                {revokePermission.isPending ? (
                  <>
                    <span
                      className="animate-spin"
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                    Removing…
                  </>
                ) : (
                  'Remove'
                )}
              </Button>
            </>
          }
        />
      )}
    </>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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

  function handleAssignOpenChange(open: boolean) {
    setIsAssignOpen(open)
    if (!open) setSelectedPermissionId('')
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

      {/* Assign Permission Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={handleAssignOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Permission</DialogTitle>
            <DialogDescription>
              Select a permission to assign to <strong>{role.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {isLoadingPermissions ? (
              <p className="text-sm text-muted-foreground">Loading permissions…</p>
            ) : (
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
              </select>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              onClick={() => handleAssignOpenChange(false)}
              disabled={assignPermission.isPending}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleAssign}
              disabled={!selectedPermissionId || assignPermission.isPending}
              aria-busy={assignPermission.isPending}
            >
              {assignPermission.isPending ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Assigning…
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Permission Confirmation Dialog */}
      <Dialog
        open={permissionToRevoke !== null}
        onOpenChange={(open) => !open && setPermissionToRevoke(null)}
      >
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Remove Permission</DialogTitle>
            <DialogDescription>
              Remove <strong>{permissionToRevoke?.name}</strong> from <strong>{role.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setPermissionToRevoke(null)}
              disabled={revokePermission.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={handleRevoke}
              disabled={revokePermission.isPending}
              aria-busy={revokePermission.isPending}
            >
              {revokePermission.isPending ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Removing…
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

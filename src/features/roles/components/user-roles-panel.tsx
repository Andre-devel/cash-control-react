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
import type { Role } from '@/features/roles/types'
import {
  useAssignRoleToUser,
  useRevokeRoleFromUser,
  useRoles,
  useRolePermissions,
} from '@/features/roles/hooks'

interface UserRolesPanelProps {
  userId: string
  userName: string
  roles: Role[]
}

export function UserRolesPanel({ userId, userName, roles }: UserRolesPanelProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [roleToRevoke, setRoleToRevoke] = useState<Role | null>(null)

  const { canUpdateRole } = useRolePermissions()
  const { data: availableRolesData, isLoading: isLoadingRoles } = useRoles({ page: 0, size: 100 })
  const availableRoles = availableRolesData?.content ?? []

  const assignRole = useAssignRoleToUser({
    onSuccess: () => {
      setIsAssignOpen(false)
      setSelectedRoleId('')
    },
  })

  const revokeRole = useRevokeRoleFromUser({
    onSuccess: () => setRoleToRevoke(null),
  })

  function handleAssignOpenChange(open: boolean) {
    setIsAssignOpen(open)
    if (!open) setSelectedRoleId('')
  }

  function handleAssign() {
    if (!selectedRoleId) return
    assignRole.mutate({ userId, roleId: selectedRoleId })
  }

  function handleRevoke() {
    if (!roleToRevoke) return
    revokeRole.mutate({ userId, roleId: roleToRevoke.id })
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Roles</h3>
          {canUpdateRole && roles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              onClick={() => setIsAssignOpen(true)}
              aria-label="Assign role"
            >
              Assign Role
            </Button>
          )}
        </div>

        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">No roles assigned.</p>
            {canUpdateRole && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsAssignOpen(true)}
                aria-label="Assign role"
              >
                Assign Role
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Assigned roles">
            {roles.map((role) => (
              <li key={role.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{role.name}</p>
                  {role.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {role.description}
                    </p>
                  )}
                </div>
                {canUpdateRole && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 shrink-0 min-h-[44px] text-destructive hover:text-destructive"
                    aria-label={`Remove role ${role.name}`}
                    onClick={() => setRoleToRevoke(role)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={handleAssignOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Select a role to assign to <strong>{userName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {isLoadingRoles ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : (
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                aria-label="Select role"
              >
                <option value="">Select a role…</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => handleAssignOpenChange(false)}
              disabled={assignRole.isPending}
            >
              Cancel
            </Button>
            <Button
              className="min-h-[44px]"
              onClick={handleAssign}
              disabled={!selectedRoleId || assignRole.isPending}
              aria-busy={assignRole.isPending}
            >
              {assignRole.isPending ? (
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

      {/* Revoke Role Confirmation Dialog */}
      <Dialog open={roleToRevoke !== null} onOpenChange={(open) => !open && setRoleToRevoke(null)}>
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Remove Role</DialogTitle>
            <DialogDescription>
              Remove <strong>{roleToRevoke?.name}</strong> from <strong>{userName}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setRoleToRevoke(null)}
              disabled={revokeRole.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
              onClick={handleRevoke}
              disabled={revokeRole.isPending}
              aria-busy={revokeRole.isPending}
            >
              {revokeRole.isPending ? (
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

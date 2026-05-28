import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
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

  function handleAssignClose() {
    setIsAssignOpen(false)
    setSelectedRoleId('')
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

      {isAssignOpen && (
        <Modal
          title="Assign Role"
          subtitle={`Select a role to assign to ${userName}.`}
          onClose={handleAssignClose}
          footer={
            <>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                onClick={handleAssignClose}
                disabled={assignRole.isPending}
              >
                Cancel
              </Button>
              <div className="spacer" />
              <Button
                variant="primary"
                className="min-h-[44px]"
                onClick={handleAssign}
                disabled={!selectedRoleId || assignRole.isPending}
                aria-busy={assignRole.isPending}
              >
                {assignRole.isPending ? (
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
            {isLoadingRoles ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : (
              <Select
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
              </Select>
            )}
          </div>
        </Modal>
      )}

      {roleToRevoke !== null && (
        <Modal
          alert
          title="Remove Role"
          subtitle={`Remove ${roleToRevoke.name} from ${userName}? This action cannot be undone.`}
          onClose={() => setRoleToRevoke(null)}
          footer={
            <>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                onClick={() => setRoleToRevoke(null)}
                disabled={revokeRole.isPending}
              >
                Cancel
              </Button>
              <div className="spacer" />
              <Button
                variant="danger"
                className="min-h-[44px]"
                onClick={handleRevoke}
                disabled={revokeRole.isPending}
                aria-busy={revokeRole.isPending}
              >
                {revokeRole.isPending ? (
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

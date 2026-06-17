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
        className="h-20 rounded bg-surface-3 animate-pulse"
        aria-busy="true"
        aria-label="Carregando permissões"
      />
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Permissões</h3>
          {canGrantPermission && permissions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px]"
              onClick={() => setIsAssignOpen(true)}
              aria-label="Atribuir permissão"
            >
              Atribuir permissão
            </Button>
          )}
        </div>

        {permissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <p className="mb-3 text-sm text-dim">Nenhuma permissão atribuída.</p>
            {canGrantPermission && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsAssignOpen(true)}
                aria-label="Atribuir permissão"
              >
                Atribuir permissão
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Permissões atribuídas">
            {permissions.map((permission) => (
              <li
                key={permission.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{permission.name}</p>
                  {permission.description && (
                    <p className="mt-0.5 text-xs text-dim truncate">{permission.description}</p>
                  )}
                </div>
                {canRevokePermission && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-2 shrink-0 min-h-[44px]"
                    aria-label={`Remover permissão ${permission.name}`}
                    onClick={() => setPermissionToRevoke(permission)}
                  >
                    Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAssignOpen && (
        <Modal
          title="Atribuir permissão"
          subtitle={`Selecione uma permissão para atribuir a ${role.name}.`}
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
                Cancelar
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
                    Atribuindo…
                  </>
                ) : (
                  'Atribuir'
                )}
              </Button>
            </>
          }
        >
          <div>
            {isLoadingPermissions ? (
              <p className="text-sm text-dim">Carregando permissões…</p>
            ) : (
              <Select
                value={selectedPermissionId}
                onChange={(e) => setSelectedPermissionId(e.target.value)}
                aria-label="Selecionar permissão"
              >
                <option value="">Selecione uma permissão…</option>
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
          title="Remover permissão"
          subtitle={`Remover ${permissionToRevoke.name} de ${role.name}? Esta ação não pode ser desfeita.`}
          onClose={() => setPermissionToRevoke(null)}
          footer={
            <>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                onClick={() => setPermissionToRevoke(null)}
                disabled={revokePermission.isPending}
              >
                Cancelar
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
                    Removendo…
                  </>
                ) : (
                  'Remover'
                )}
              </Button>
            </>
          }
        />
      )}
    </>
  )
}

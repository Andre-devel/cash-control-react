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
          <h3 className="text-sm font-semibold">Papéis</h3>
          {canUpdateRole && roles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px]"
              onClick={() => setIsAssignOpen(true)}
              aria-label="Atribuir papel"
            >
              Atribuir papel
            </Button>
          )}
        </div>

        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <p className="mb-3 text-sm text-dim">Nenhum papel atribuído.</p>
            {canUpdateRole && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsAssignOpen(true)}
                aria-label="Atribuir papel"
              >
                Atribuir papel
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Papéis atribuídos">
            {roles.map((role) => (
              <li key={role.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{role.name}</p>
                  {role.description && (
                    <p className="mt-0.5 text-xs text-dim truncate">{role.description}</p>
                  )}
                </div>
                {canUpdateRole && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-2 shrink-0 min-h-[44px]"
                    aria-label={`Remover papel ${role.name}`}
                    onClick={() => setRoleToRevoke(role)}
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
          title="Atribuir papel"
          subtitle={`Selecione um papel para atribuir a ${userName}.`}
          onClose={handleAssignClose}
          footer={
            <>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                onClick={handleAssignClose}
                disabled={assignRole.isPending}
              >
                Cancelar
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
            {isLoadingRoles ? (
              <p className="text-sm text-dim">Carregando papéis…</p>
            ) : (
              <Select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                aria-label="Selecionar papel"
              >
                <option value="">Selecione um papel…</option>
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
          title="Remover papel"
          subtitle={`Remover ${roleToRevoke.name} de ${userName}? Esta ação não pode ser desfeita.`}
          onClose={() => setRoleToRevoke(null)}
          footer={
            <>
              <Button
                variant="ghost"
                className="min-h-[44px]"
                onClick={() => setRoleToRevoke(null)}
                disabled={revokeRole.isPending}
              >
                Cancelar
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

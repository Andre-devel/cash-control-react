import { useState } from 'react'
import { Check, FolderKey, KeyRound, Plus, X } from 'lucide-react'
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

interface PermissionGroup {
  key: string
  items: Permission[]
}

/** Agrupa pelo recurso antes de ":" (ex.: `role:create` → `role`), em ordem alfabética. */
function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const map = new Map<string, Permission[]>()
  for (const permission of permissions) {
    const sep = permission.name.indexOf(':')
    const key = sep > 0 ? permission.name.slice(0, sep) : 'geral'
    const list = map.get(key) ?? []
    list.push(permission)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    }))
}

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
        className="h-48 animate-pulse rounded-xl bg-surface-3 motion-reduce:animate-none"
        aria-busy="true"
        aria-label="Carregando permissões"
      />
    )
  }

  const groups = groupPermissions(permissions)

  const assignButton = (
    <Button
      variant="ghost"
      size="sm"
      className="min-h-[44px]"
      leading={<Plus size={16} aria-hidden="true" />}
      onClick={() => setIsAssignOpen(true)}
      aria-label="Atribuir permissão"
    >
      Atribuir permissão
    </Button>
  )

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
        <div className="flex min-h-[60px] items-center gap-3 border-b border-border px-4 py-2">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 font-display text-h2">Permissões</h2>
            <p className="m-0 text-caption tabular-nums text-fg-muted">
              {permissions.length === 1
                ? '1 permissão atribuída'
                : `${permissions.length} permissões atribuídas`}
            </p>
          </div>
          {canGrantPermission && permissions.length > 0 && assignButton}
        </div>

        {permissions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <KeyRound size={24} aria-hidden="true" />
            </div>
            <p>Nenhuma permissão atribuída.</p>
            {canGrantPermission && assignButton}
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 md:p-5">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`perm-group-${group.key}`}>
                <h3
                  id={`perm-group-${group.key}`}
                  className="m-0 mb-2 flex items-center gap-2 text-overline uppercase text-fg-subtle"
                >
                  <FolderKey size={14} aria-hidden="true" />
                  {group.key}
                  <span className="tabular-nums">· {group.items.length}</span>
                </h3>
                <ul
                  className="m-0 grid list-none !gap-2 p-0 md:grid-cols-2"
                  aria-label={`Permissões atribuídas — ${group.key}`}
                >
                  {group.items.map((permission) => (
                    <li
                      key={permission.id}
                      className="flex min-h-[56px] items-center gap-3 rounded-lg border border-border bg-bg/40 py-2 pl-3 pr-1"
                    >
                      <span
                        className="grid h-6 w-6 flex-none place-items-center rounded-sm bg-brand text-brand-ink"
                        aria-hidden="true"
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate font-mono text-body-sm font-medium">
                          {permission.name}
                        </p>
                        {permission.description && (
                          <p className="m-0 mt-0.5 truncate text-caption text-fg-muted">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      {canRevokePermission && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px] flex-none text-fg-muted hover:text-overdue"
                          aria-label={`Remover permissão ${permission.name}`}
                          title="Remover"
                          onClick={() => setPermissionToRevoke(permission)}
                        >
                          <X size={16} aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
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

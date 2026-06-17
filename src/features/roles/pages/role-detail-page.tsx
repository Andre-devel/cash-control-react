import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useRole, useUpdateRole, useDeleteRole, useRolePermissions } from '@/features/roles/hooks'
import { RolePermissionsPanel } from '../components/role-permissions-panel'
import { RoleForm } from '../components/role-form'
import { ROUTES } from '@/app/router/routes'
import type { NormalizedError } from '@/features/auth/types'
import type { UpdateRoleFormValues } from '@/features/roles/schemas'

function BackLink() {
  return (
    <Link
      to={ROUTES.ROLES}
      className="inline-flex items-center text-sm text-dim"
      aria-label="Voltar para lista de papéis"
    >
      ← Voltar para papéis
    </Link>
  )
}

export default function RoleDetailPage() {
  const { roleId = '' } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const { canUpdateRole, canDeleteRole } = useRolePermissions()
  const { data: role, isLoading, isError, error } = useRole(roleId)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const updateRole = useUpdateRole({
    onSuccess: () => setIsEditOpen(false),
  })

  const deleteRole = useDeleteRole({
    onSuccess: () => navigate(ROUTES.ROLES),
  })

  function handleUpdate(values: UpdateRoleFormValues) {
    updateRole.mutate({ roleId, payload: { description: values.description } })
  }

  function handleDelete() {
    deleteRole.mutate(roleId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Carregando detalhes do papel">
        <div
          className="h-8 w-64 rounded animate-pulse"
          style={{ background: 'var(--surface-3)' }}
        />
        <div className="h-32 rounded animate-pulse" style={{ background: 'var(--surface-3)' }} />
      </div>
    )
  }

  if (isError) {
    const normalizedError = error as unknown as NormalizedError
    if (normalizedError?.status === 404) {
      return (
        <div className="space-y-4">
          <BackLink />
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h1 className="mb-2 text-2xl font-bold">Papel não encontrado</h1>
            <p className="mb-4 text-dim">O papel que você está procurando não existe.</p>
            <Button asChild variant="ghost">
              <Link to={ROUTES.ROLES}>Voltar para papéis</Link>
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm" style={{ color: 'var(--expense)' }}>
          Falha ao carregar papel.
        </p>
      </div>
    )
  }

  if (!role) return null

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="card">
        <div className="card-h" style={{ alignItems: 'flex-start' }}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3>{role.name}</h3>
              {role.systemRole && (
                <span className="badge muted" aria-label="Papel do sistema">
                  Sistema
                </span>
              )}
            </div>
            {role.description && <p className="text-sm text-dim">{role.description}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {canUpdateRole && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsEditOpen(true)}
              >
                Editar papel
              </Button>
            )}

            {canDeleteRole &&
              (role.systemRole ? (
                <span
                  tabIndex={0}
                  className="inline-flex"
                  title="Papéis do sistema não podem ser excluídos"
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled
                    aria-disabled="true"
                    className="pointer-events-none min-h-[44px]"
                  >
                    Excluir papel
                  </Button>
                </span>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Excluir papel
                </Button>
              ))}
          </div>
        </div>
        <div className="card-b">
          <RolePermissionsPanel role={role} />
        </div>
      </div>

      {isEditOpen && (
        <Modal title="Editar papel" onClose={() => setIsEditOpen(false)}>
          <RoleForm
            mode="update"
            roleName={role.name}
            defaultValues={{ description: role.description }}
            isPending={updateRole.isPending}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditOpen(false)}
          />
        </Modal>
      )}

      {isDeleteOpen && (
        <Modal
          alert
          title="Excluir papel"
          subtitle={
            <>
              Tem certeza que deseja excluir o papel <strong>{role.name}</strong>? Esta ação não
              pode ser desfeita.
            </>
          }
          onClose={() => setIsDeleteOpen(false)}
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteRole.isPending}
              >
                Cancelar
              </Button>
              <div className="spacer" />
              <Button
                variant="danger"
                size="lg"
                onClick={handleDelete}
                disabled={deleteRole.isPending}
                aria-busy={deleteRole.isPending}
              >
                {deleteRole.isPending ? (
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
                    Excluindo…
                  </>
                ) : (
                  'Excluir'
                )}
              </Button>
            </>
          }
        />
      )}
    </div>
  )
}

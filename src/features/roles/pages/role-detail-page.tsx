import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil, SearchX, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useRole, useUpdateRole, useDeleteRole, useRolePermissions } from '@/features/roles/hooks'
import { RolePermissionsPanel } from '../components/role-permissions-panel'
import { RoleForm } from '../components/role-form'
import { RoleIcon, SystemRoleBadge } from '../components/role-icon'
import { ROUTES } from '@/app/router/routes'
import type { NormalizedError } from '@/features/auth/types'
import type { UpdateRoleFormValues } from '@/features/roles/schemas'

function BackLink() {
  return (
    <Link
      to={ROUTES.ROLES}
      className="-ml-2 mb-4 inline-flex min-h-touch items-center gap-1 rounded-md px-2 text-body-sm font-medium text-fg-muted no-underline hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      aria-label="Voltar para lista de papéis"
    >
      <ChevronLeft size={18} aria-hidden="true" />
      Papéis
    </Link>
  )
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
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
      <div
        className="mx-auto flex max-w-[1120px] flex-col gap-4"
        aria-busy="true"
        aria-label="Carregando detalhes do papel"
      >
        <div className="h-5 w-24 animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-3 motion-reduce:animate-none" />
          <div className="h-8 w-64 max-w-full animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-surface-3 motion-reduce:animate-none" />
      </div>
    )
  }

  if (isError) {
    const normalizedError = error as unknown as NormalizedError
    if (normalizedError?.status === 404) {
      return (
        <div className="mx-auto max-w-[1120px]">
          <BackLink />
          <div className="empty-state rounded-xl border border-border bg-surface-1">
            <div className="icon !bg-info/15 !text-info">
              <SearchX size={24} aria-hidden="true" />
            </div>
            <h1 className="m-0 mb-1.5 font-display text-h2">Papel não encontrado</h1>
            <p>O papel que você está procurando não existe ou foi excluído.</p>
            <Button asChild variant="ghost" className="min-h-[44px]">
              <Link to={ROUTES.ROLES}>Voltar para papéis</Link>
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-[1120px]">
        <BackLink />
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-overdue/30 bg-overdue-soft p-4 text-body-sm text-overdue"
        >
          <TriangleAlert size={18} className="mt-px flex-none" aria-hidden="true" />
          <span>Falha ao carregar papel.</span>
        </div>
      </div>
    )
  }

  if (!role) return null

  return (
    <div className="mx-auto max-w-[1120px]">
      <BackLink />

      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <RoleIcon role={role} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="m-0 break-words font-display text-h1">{role.name}</h1>
              {role.systemRole && <SystemRoleBadge aria-label="Papel do sistema" />}
            </div>
            {role.description && (
              <p className="m-0 mt-1 text-body-sm leading-[1.5] text-fg-muted">
                {role.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {canUpdateRole && (
            <Button
              variant="ghost"
              className="min-h-[44px] flex-1 md:flex-none"
              leading={<Pencil size={16} aria-hidden="true" />}
              onClick={() => setIsEditOpen(true)}
            >
              Editar papel
            </Button>
          )}

          {canDeleteRole &&
            (role.systemRole ? (
              <span
                tabIndex={0}
                className="inline-flex flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:flex-none"
                title="Papéis do sistema não podem ser excluídos"
              >
                <Button
                  variant="destructive"
                  disabled
                  aria-disabled="true"
                  className="pointer-events-none min-h-[44px] w-full"
                  leading={<Trash2 size={16} aria-hidden="true" />}
                >
                  Excluir papel
                </Button>
              </span>
            ) : (
              <Button
                variant="destructive"
                className="min-h-[44px] flex-1 md:flex-none"
                leading={<Trash2 size={16} aria-hidden="true" />}
                onClick={() => setIsDeleteOpen(true)}
              >
                Excluir papel
              </Button>
            ))}
        </div>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section className="min-w-0 flex-1" aria-label="Permissões do papel">
          <RolePermissionsPanel role={role} />
        </section>

        <aside className="rounded-xl border border-border bg-surface-1 p-4 lg:w-[300px] lg:flex-none">
          <h2 className="m-0 mb-3 text-overline uppercase text-fg-subtle">Detalhes</h2>
          <dl className="m-0 flex flex-col gap-3 text-body-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-fg-muted">Tipo</dt>
              <dd className="m-0 font-medium">{role.systemRole ? 'Sistema' : 'Personalizado'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-fg-muted">Criado em</dt>
              <dd className="m-0 font-medium tabular-nums">{fmtDate(role.createdAt)}</dd>
            </div>
          </dl>
          {role.systemRole && (
            <p className="m-0 mt-3 border-t border-border pt-3 text-caption leading-[1.45] text-fg-muted">
              Papéis do sistema não podem ser excluídos.
            </p>
          )}
        </aside>
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

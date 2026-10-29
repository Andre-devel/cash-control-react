import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useRoles, useCreateRole, useRolePermissions } from '@/features/roles/hooks'
import { RoleList } from '../components/role-list'
import { RoleForm } from '../components/role-form'
import { toast } from '@/lib/toast'
import type { CreateRoleFormValues } from '@/features/roles/schemas'
import type { NormalizedError } from '@/features/auth/types'

const DEFAULT_PAGE_SIZE = 20

export default function RolesPage() {
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createNameError, setCreateNameError] = useState<string | undefined>()

  const { canCreateRole } = useRolePermissions()
  const { data, isLoading, isError, refetch, isFetching } = useRoles({
    page,
    size: DEFAULT_PAGE_SIZE,
  })

  const roles = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const isEmpty = !isLoading && roles.length === 0

  const createRole = useCreateRole({
    onSuccess: () => {
      setIsCreateOpen(false)
      setCreateNameError(undefined)
    },
    onError: (error: NormalizedError) => {
      if (error.status === 409) {
        setCreateNameError('Já existe um papel com este nome.')
      } else {
        toast.error(error.message)
      }
    },
  })

  function handleCreate(values: CreateRoleFormValues) {
    setCreateNameError(undefined)
    createRole.mutate({ name: values.name, description: values.description })
  }

  function handleCreateClose() {
    setIsCreateOpen(false)
    setCreateNameError(undefined)
  }

  const header = (
    <div className="page-h flex-wrap">
      <div className="min-w-0">
        <span className="text-overline uppercase text-fg-subtle">Sistema</span>
        <h1 className="title">Papéis</h1>
        <div className="desc">Funções de acesso e as permissões de cada uma.</div>
      </div>
      <div className="spacer" />
      {canCreateRole && !isError && (
        <div className="actions">
          <Button
            variant="primary"
            className="min-h-[44px]"
            leading={<Plus size={16} aria-hidden="true" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Novo papel
          </Button>
        </div>
      )}
    </div>
  )

  if (isError) {
    return (
      <div className="mx-auto max-w-[960px]">
        {header}
        <div className="empty-state rounded-xl border border-border bg-surface-1" role="alert">
          <div className="icon !bg-overdue-soft !text-overdue">
            <TriangleAlert size={24} aria-hidden="true" />
          </div>
          <h4>Falha ao carregar papéis.</h4>
          <p>Verifique sua conexão e tente de novo.</p>
          <Button variant="ghost" className="min-h-[44px]" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[960px]">
      {header}

      {isEmpty ? (
        <div className="empty-state rounded-xl border border-border bg-surface-1">
          <div className="icon">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h4>Nenhum papel encontrado.</h4>
          <p>Crie papéis para agrupar permissões e atribuí-los aos usuários.</p>
          {canCreateRole && (
            <Button
              variant="primary"
              className="min-h-[44px]"
              leading={<Plus size={16} aria-hidden="true" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Novo papel
            </Button>
          )}
        </div>
      ) : (
        <RoleList roles={roles} isLoading={isLoading} isEmpty={isEmpty} />
      )}

      {!isLoading && !isEmpty && totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginação">
          <Button
            variant="ghost"
            className="min-h-[44px]"
            leading={<ChevronLeft size={16} aria-hidden="true" />}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <span className="text-body-sm tabular-nums text-fg-muted" aria-live="polite">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="ghost"
            className="min-h-[44px]"
            trailing={<ChevronRight size={16} aria-hidden="true" />}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isFetching}
            aria-label="Próxima página"
          >
            Próxima
          </Button>
        </nav>
      )}

      {isCreateOpen && (
        <Modal title="Criar papel" onClose={handleCreateClose}>
          <RoleForm
            mode="create"
            isPending={createRole.isPending}
            onSubmit={handleCreate}
            onCancel={handleCreateClose}
            nameError={createNameError}
          />
        </Modal>
      )}
    </div>
  )
}

import { useState } from 'react'
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
        setCreateNameError('A role with this name already exists.')
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

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <div
          className="rounded-lg p-4"
          style={{ border: '1px solid var(--expense-soft)', background: 'var(--expense-soft)' }}
        >
          <p className="text-sm" style={{ color: 'var(--expense)' }}>
            Failed to load roles.
          </p>
        </div>
        <Button variant="ghost" className="min-h-[44px]" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        {canCreateRole && (
          <Button size="sm" className="min-h-[44px]" onClick={() => setIsCreateOpen(true)}>
            New Role
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-dim">No roles found.</p>
          {canCreateRole && (
            <Button size="sm" className="min-h-[44px]" onClick={() => setIsCreateOpen(true)}>
              New Role
            </Button>
          )}
        </div>
      ) : (
        <RoleList roles={roles} isLoading={isLoading} isEmpty={isEmpty} />
      )}

      {!isLoading && !isEmpty && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-sm text-dim" aria-live="polite">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isFetching}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      )}

      {isCreateOpen && (
        <Modal title="Create Role" onClose={handleCreateClose}>
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

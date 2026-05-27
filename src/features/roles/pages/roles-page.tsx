import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  function handleCreateOpenChange(open: boolean) {
    setIsCreateOpen(open)
    if (!open) {
      setCreateNameError(undefined)
    }
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Failed to load roles.</p>
        </div>
        <Button variant="outline" className="min-h-[44px]" onClick={() => refetch()}>
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
          <p className="mb-4 text-muted-foreground">No roles found.</p>
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
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
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

      <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <RoleForm
            mode="create"
            isPending={createRole.isPending}
            onSubmit={handleCreate}
            onCancel={() => handleCreateOpenChange(false)}
            nameError={createNameError}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

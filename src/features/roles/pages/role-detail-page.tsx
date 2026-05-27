import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Back to roles list"
    >
      ← Back to Roles
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
      <div className="space-y-4" aria-busy="true" aria-label="Loading role details">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded bg-muted animate-pulse" />
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
            <h1 className="mb-2 text-2xl font-bold">Role Not Found</h1>
            <p className="mb-4 text-muted-foreground">
              The role you are looking for does not exist.
            </p>
            <Button asChild variant="outline">
              <Link to={ROUTES.ROLES}>Back to Roles</Link>
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-destructive">Failed to load role.</p>
      </div>
    )
  }

  if (!role) return null

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <BackLink />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{role.name}</CardTitle>
                  {role.systemRole && (
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                      aria-label="System role"
                    >
                      System
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {canUpdateRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => setIsEditOpen(true)}
                  >
                    Edit Role
                  </Button>
                )}

                {canDeleteRole &&
                  (role.systemRole ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-flex">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled
                            aria-disabled="true"
                            className="pointer-events-none min-h-[44px]"
                          >
                            Delete Role
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>System roles cannot be deleted</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      Delete Role
                    </Button>
                  ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RolePermissionsPanel role={role} />
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
            </DialogHeader>
            <RoleForm
              mode="update"
              roleName={role.name}
              defaultValues={{ description: role.description }}
              isPending={updateRole.isPending}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Role Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent role="alertdialog">
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the role <strong>{role.name}</strong>? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteRole.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleDelete}
                disabled={deleteRole.isPending}
                aria-busy={deleteRole.isPending}
              >
                {deleteRole.isPending ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { createRoleSchema, updateRoleSchema } from '@/features/roles/schemas'
import type { CreateRoleFormValues, UpdateRoleFormValues } from '@/features/roles/schemas'

type CreateMode = {
  mode: 'create'
  defaultValues?: Partial<CreateRoleFormValues>
  onSubmit: (values: CreateRoleFormValues) => void
  nameError?: string
}

type UpdateMode = {
  mode: 'update'
  defaultValues?: Partial<UpdateRoleFormValues>
  onSubmit: (values: UpdateRoleFormValues) => void
  roleName: string
}

type RoleFormProps = (CreateMode | UpdateMode) & {
  isPending?: boolean
  onCancel?: () => void
}

function Spinner() {
  return (
    <span
      className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
  )
}

export function RoleForm(props: RoleFormProps) {
  const { mode, isPending = false, onCancel } = props

  const createForm = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues:
      mode === 'create'
        ? { name: '', description: '', ...props.defaultValues }
        : { name: '', description: '' },
  })

  const updateForm = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues:
      mode === 'update' ? { description: '', ...props.defaultValues } : { description: '' },
  })

  const formActions = (label: string) => (
    <div className="flex justify-end gap-2 pt-2">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px]"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      )}
      <Button type="submit" size="lg" disabled={isPending} aria-busy={isPending}>
        {isPending ? (
          <>
            <Spinner />
            {label}…
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  )

  if (mode === 'create') {
    return (
      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(props.onSubmit)} noValidate className="space-y-4">
          <FormField
            control={createForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="MODERATOR" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
                {props.nameError && !createForm.formState.errors.name && (
                  <p className="text-sm font-medium text-destructive">{props.nameError}</p>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={createForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the role's purpose"
                    rows={3}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {formActions('Create Role')}
        </form>
      </Form>
    )
  }

  return (
    <Form {...updateForm}>
      <form onSubmit={updateForm.handleSubmit(props.onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="update-role-name">Name</Label>
          <Input
            id="update-role-name"
            value={props.roleName}
            readOnly
            disabled
            className="cursor-not-allowed"
          />
        </div>
        <FormField
          control={updateForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role's purpose"
                  rows={3}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formActions('Save Changes')}
      </form>
    </Form>
  )
}

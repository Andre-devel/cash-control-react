import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
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
          variant="ghost"
          size="sm"
          className="min-h-[44px]"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
      )}
      <Button type="submit" size="lg" variant="primary" disabled={isPending} aria-busy={isPending}>
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
      <form onSubmit={createForm.handleSubmit(props.onSubmit)} noValidate className="col gap-4">
        <Field
          label="Nome"
          error={
            createForm.formState.errors.name?.message ||
            (props.nameError && !createForm.formState.errors.name ? props.nameError : undefined)
          }
        >
          <Input placeholder="MODERADOR" autoComplete="off" {...createForm.register('name')} />
        </Field>
        <Field label="Descrição" error={createForm.formState.errors.description?.message}>
          <Textarea
            placeholder="Descreva o propósito do papel"
            rows={3}
            {...createForm.register('description')}
          />
        </Field>
        {formActions('Criar papel')}
      </form>
    )
  }

  return (
    <form onSubmit={updateForm.handleSubmit(props.onSubmit)} noValidate className="col gap-4">
      <Field label="Nome" htmlFor="update-role-name">
        <Input id="update-role-name" value={props.roleName} readOnly disabled />
      </Field>
      <Field label="Descrição" error={updateForm.formState.errors.description?.message}>
        <Textarea
          placeholder="Descreva o propósito do papel"
          rows={3}
          {...updateForm.register('description')}
        />
      </Field>
      {formActions('Salvar alterações')}
    </form>
  )
}

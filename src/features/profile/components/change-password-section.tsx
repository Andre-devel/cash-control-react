import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { changePasswordSchema } from '@/features/auth/schemas/change-password.schema'
import { useChangePassword } from '@/features/auth/hooks/use-change-password'
import type { ChangePasswordFormValues } from '@/features/auth/schemas/change-password.schema'
import type { NormalizedError } from '@/features/auth/types'

export function ChangePasswordSection() {
  const { mutate, isPending } = useChangePassword()

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  function onSubmit(data: ChangePasswordFormValues) {
    mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onError: (error: NormalizedError) => {
          if (error.errorCode === 'WRONG_CURRENT_PASSWORD') {
            form.setError('currentPassword', {
              type: 'manual',
              message: 'Senha atual incorreta',
            })
          }
        },
      },
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Senha atual" error={form.formState.errors.currentPassword?.message}>
        <PasswordInput
          placeholder="Senha atual"
          autoComplete="current-password"
          error={!!form.formState.errors.currentPassword}
          {...form.register('currentPassword')}
        />
      </Field>

      <Field
        label="Nova senha"
        hint="Mínimo 8 caracteres."
        error={form.formState.errors.newPassword?.message}
      >
        <PasswordInput
          placeholder="Nova senha"
          autoComplete="new-password"
          error={!!form.formState.errors.newPassword}
          {...form.register('newPassword')}
        />
      </Field>

      <Field label="Confirmar nova senha" error={form.formState.errors.confirmPassword?.message}>
        <PasswordInput
          placeholder="Confirmar nova senha"
          autoComplete="new-password"
          error={!!form.formState.errors.confirmPassword}
          {...form.register('confirmPassword')}
        />
      </Field>

      <Button type="submit" variant="primary" className="self-start" loading={isPending}>
        {isPending ? 'Salvando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}

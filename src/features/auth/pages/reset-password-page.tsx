import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleX, Clock, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthHeading, AuthLayout } from '@/features/auth/components/auth-layout'
import { AuthStatus, AuthStatusText } from '@/features/auth/components/auth-status'
import { PasswordStrength } from '@/features/auth/components/password-strength'
import { resetPasswordSchema } from '@/features/auth/schemas/reset-password.schema'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'
import { ROUTES } from '@/app/router/routes'
import type { ResetPasswordFormValues } from '@/features/auth/schemas/reset-password.schema'
import type { NormalizedError } from '@/features/auth/types'

function RequestNewLinkActions() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Button asChild variant="primary" size="lg" className="w-full">
        <Link to={ROUTES.FORGOT_PASSWORD}>Solicitar novo link</Link>
      </Button>
      <Button asChild variant="ghost" size="lg" className="w-full">
        <Link to={ROUTES.LOGIN}>Voltar para login</Link>
      </Button>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const { mutate, isPending, isError, error } = useResetPassword()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const newPassword = form.watch('newPassword')

  function onSubmit(data: ResetPasswordFormValues) {
    mutate({ token, newPassword: data.newPassword })
  }

  const isExpiredToken = isError && (error as NormalizedError)?.errorCode === 'TOKEN_EXPIRED'

  if (!token) {
    return (
      <AuthLayout>
        <AuthStatus icon={CircleX} tone="overdue" title="Link inválido">
          <AuthStatusText>Este link de redefinição de senha é inválido ou expirou.</AuthStatusText>
        </AuthStatus>
        <RequestNewLinkActions />
      </AuthLayout>
    )
  }

  if (isExpiredToken) {
    return (
      <AuthLayout>
        <AuthStatus icon={Clock} tone="pending" title="Link expirado">
          <AuthStatusText>
            Este link de redefinição de senha expirou. Solicite um novo link abaixo.
          </AuthStatusText>
        </AuthStatus>
        <RequestNewLinkActions />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthHeading title="Nova senha" description="Escolha uma nova senha para sua conta." />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          <Field label="Nova senha" error={form.formState.errors.newPassword?.message}>
            <PasswordInput
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              error={!!form.formState.errors.newPassword}
              {...form.register('newPassword')}
            />
          </Field>
          <PasswordStrength password={newPassword ?? ''} showRules />
        </div>

        <Field label="Confirmar nova senha" error={form.formState.errors.confirmPassword?.message}>
          <PasswordInput
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!form.formState.errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
        </Field>

        {isError && !isExpiredToken && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg bg-overdue-soft p-3 text-body-sm text-overdue"
          >
            <TriangleAlert size={18} className="mt-px flex-none" aria-hidden="true" />
            <span>{(error as NormalizedError)?.message || 'Falha ao redefinir a senha.'}</span>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isPending}>
          {isPending ? 'Salvando…' : 'Redefinir senha'}
        </Button>

        <Button asChild variant="ghost" size="lg" className="w-full">
          <Link to={ROUTES.LOGIN}>Voltar para login</Link>
        </Button>
      </form>
    </AuthLayout>
  )
}

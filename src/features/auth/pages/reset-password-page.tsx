import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { resetPasswordSchema } from '@/features/auth/schemas/reset-password.schema'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'
import { ROUTES } from '@/app/router/routes'
import type { ResetPasswordFormValues } from '@/features/auth/schemas/reset-password.schema'
import type { NormalizedError } from '@/features/auth/types'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const { mutate, isPending, isError, error } = useResetPassword()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  function onSubmit(data: ResetPasswordFormValues) {
    mutate({ token, newPassword: data.newPassword })
  }

  const isExpiredToken = isError && (error as NormalizedError)?.errorCode === 'TOKEN_EXPIRED'

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          {!token ? (
            <>
              <h1>Link inválido</h1>
              <div className="sub">Este link de redefinição de senha é inválido ou expirou.</div>
              <div className="auth-foot">
                <Link to={ROUTES.FORGOT_PASSWORD} className="link">
                  Solicitar novo link
                </Link>
              </div>
            </>
          ) : isExpiredToken ? (
            <>
              <h1>Link expirado</h1>
              <div className="sub">
                Este link de redefinição de senha expirou. Solicite um novo link abaixo.
              </div>
              <div className="auth-foot">
                <Link to={ROUTES.FORGOT_PASSWORD} className="link">
                  Solicitar novo link
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>Nova senha</h1>
              <div className="sub">Escolha uma nova senha para sua conta.</div>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="col"
                style={{ gap: 14 }}
              >
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

                <Field
                  label="Confirmar nova senha"
                  error={form.formState.errors.confirmPassword?.message}
                >
                  <PasswordInput
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={!!form.formState.errors.confirmPassword}
                    {...form.register('confirmPassword')}
                  />
                </Field>

                {isError && !isExpiredToken && (
                  <p style={{ fontSize: 13, color: 'var(--expense)' }} role="alert">
                    {(error as NormalizedError)?.message || 'Falha ao redefinir a senha.'}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? 'Salvando…' : 'Redefinir senha'}
                </Button>

                <Link to={ROUTES.LOGIN}>
                  <Button type="button" variant="ghost" size="lg" style={{ width: '100%' }}>
                    Voltar para login
                  </Button>
                </Link>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

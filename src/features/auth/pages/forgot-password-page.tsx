import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { forgotPasswordSchema } from '@/features/auth/schemas/forgot-password.schema'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'
import { ROUTES } from '@/app/router/routes'
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password.schema'

export default function ForgotPasswordPage() {
  const { mutate, isPending, isSuccess } = useForgotPassword()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(data: ForgotPasswordFormValues) {
    mutate(data.email)
  }

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          <h1>Recuperar acesso</h1>
          <div className="sub">Enviaremos um link para redefinir sua senha.</div>

          {isSuccess ? (
            <>
              <div className="card" style={{ padding: '12px 16px', fontSize: 14, marginTop: 8 }}>
                Se esse e-mail estiver cadastrado, você receberá o link em breve. Verifique também a
                pasta de spam.
              </div>
              <div className="auth-foot">
                <Link to={ROUTES.LOGIN} className="link">
                  Voltar para login
                </Link>
              </div>
            </>
          ) : (
            <>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
                className="col"
                style={{ gap: 14 }}
              >
                <Field label="E-mail" error={form.formState.errors.email?.message}>
                  <Input
                    type="email"
                    placeholder="voce@email.com"
                    autoComplete="email"
                    error={!!form.formState.errors.email}
                    {...form.register('email')}
                  />
                </Field>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? 'Enviando…' : 'Enviar link'}
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

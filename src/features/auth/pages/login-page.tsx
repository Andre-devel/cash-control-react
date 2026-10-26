import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button'
import { loginSchema } from '@/features/auth/schemas/login.schema'
import { useLogin } from '@/features/auth/hooks/use-login'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/app/router/routes'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mutate, isPending } = useLogin()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  function onSubmit(data: LoginFormValues) {
    mutate(data)
  }

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs">
            <Link to={ROUTES.LOGIN} className="on">
              Entrar
            </Link>
            <Link to={ROUTES.REGISTER}>Criar conta</Link>
          </div>

          <h1>Bem-vindo de volta</h1>
          <div className="sub">Entre para gerenciar suas finanças.</div>

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

            <Field label="Senha" error={form.formState.errors.password?.message}>
              <PasswordInput
                placeholder="••••••••"
                autoComplete="current-password"
                error={!!form.formState.errors.password}
                {...form.register('password')}
              />
            </Field>

            <div className="row between" style={{ marginTop: -4 }}>
              <label
                className="row gap-2"
                style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <input type="checkbox" className="checkbox" />
                Manter conectado
              </label>
              <Link to={ROUTES.FORGOT_PASSWORD} className="link" style={{ fontSize: 12 }}>
                Esqueci minha senha
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.6s linear infinite',
                    }}
                    aria-hidden="true"
                  />
                  Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="auth-divider">ou continue com</div>

            <GoogleSignInButton label="Entrar com Google" />
          </form>

          <div className="auth-foot">
            Novo por aqui?{' '}
            <Link to={ROUTES.REGISTER} className="link">
              Crie sua conta
            </Link>
          </div>
          <div className="auth-foot">
            <Link to={ROUTES.PRIVACY_POLICY} className="link">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

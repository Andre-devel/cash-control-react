import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { loginSchema } from '@/features/auth/schemas/login.schema'
import { useLogin } from '@/features/auth/hooks/use-login'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/app/router/routes'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'

function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

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

            <Button type="button" size="lg" leading={<GoogleIcon />}>
              Entrar com Google
            </Button>
          </form>

          <div className="auth-foot">
            Novo por aqui?{' '}
            <Link to={ROUTES.REGISTER} className="link">
              Crie sua conta
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

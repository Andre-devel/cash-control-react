import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { registerSchema } from '@/features/auth/schemas/register.schema'
import { useRegister } from '@/features/auth/hooks/use-register'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'
import type { NormalizedError } from '@/features/auth/types'

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

export default function RegisterPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mutate, isPending } = useRegister()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  function onSubmit(data: RegisterFormValues) {
    mutate(data, {
      onError: (error: NormalizedError) => {
        if (error.errorCode === 'EMAIL_ALREADY_IN_USE') {
          form.setError('email', {
            type: 'manual',
            message: 'This email address is already registered',
          })
        } else {
          toast.error('Registration failed. Please try again.')
        }
      },
    })
  }

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-tabs">
            <Link to={ROUTES.LOGIN}>Entrar</Link>
            <Link to={ROUTES.REGISTER} className="on">
              Criar conta
            </Link>
          </div>

          <h1>Crie sua conta</h1>
          <div className="sub">Comece a organizar suas finanças hoje.</div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="col"
            style={{ gap: 14 }}
          >
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
                error={!!form.formState.errors.name}
                {...form.register('name')}
              />
            </Field>

            <Field label="E-mail" error={form.formState.errors.email?.message}>
              <Input
                type="email"
                placeholder="voce@email.com"
                autoComplete="email"
                error={!!form.formState.errors.email}
                {...form.register('email')}
              />
            </Field>

            <Field
              label="Senha"
              hint="Mínimo 8 caracteres."
              error={form.formState.errors.password?.message}
            >
              <PasswordInput
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
                error={!!form.formState.errors.password}
                {...form.register('password')}
              />
            </Field>

            <Field label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}>
              <PasswordInput
                placeholder="••••••••"
                autoComplete="new-password"
                error={!!form.formState.errors.confirmPassword}
                {...form.register('confirmPassword')}
              />
            </Field>

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
                  Criando conta…
                </>
              ) : (
                'Criar conta'
              )}
            </Button>

            <div className="auth-divider">ou</div>

            <Button type="button" size="lg" leading={<GoogleIcon />}>
              Continuar com Google
            </Button>
          </form>

          <div className="auth-foot">
            Já tem uma conta?{' '}
            <Link to={ROUTES.LOGIN} className="link">
              Entrar
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

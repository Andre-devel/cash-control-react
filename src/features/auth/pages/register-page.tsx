import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button'
import { registerSchema } from '@/features/auth/schemas/register.schema'
import { useRegister } from '@/features/auth/hooks/use-register'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'
import type { NormalizedError } from '@/features/auth/types'

export default function RegisterPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mutate, isPending } = useRegister()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      consentAccepted: false,
    },
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
            message: 'Este endereço de e-mail já está cadastrado',
          })
        } else {
          toast.error('Falha no cadastro. Por favor, tente novamente.')
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

            <Field error={form.formState.errors.consentAccepted?.message}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  style={{ marginTop: 2, flexShrink: 0 }}
                  aria-invalid={!!form.formState.errors.consentAccepted}
                  {...form.register('consentAccepted')}
                />
                <span>
                  Li e aceito a{' '}
                  {/* Nova aba: navegar aqui descartaria o que já foi preenchido no formulário. */}
                  <Link to={ROUTES.PRIVACY_POLICY} target="_blank" rel="noopener" className="link">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
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

            <GoogleSignInButton label="Continuar com Google" />
          </form>

          <div className="auth-foot">
            Já tem uma conta?{' '}
            <Link to={ROUTES.LOGIN} className="link">
              Entrar
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

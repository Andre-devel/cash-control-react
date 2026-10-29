import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthHeading, AuthLayout } from '@/features/auth/components/auth-layout'
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button'
import { PasswordStrength } from '@/features/auth/components/password-strength'
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

  const password = form.watch('password')

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

  const consentError = form.formState.errors.consentAccepted?.message

  return (
    <AuthLayout>
      <AuthHeading title="Crie sua conta" description="Comece a organizar suas finanças hoje." />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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

        <div className="flex flex-col gap-2">
          <Field label="Senha" error={form.formState.errors.password?.message}>
            <PasswordInput
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              error={!!form.formState.errors.password}
              {...form.register('password')}
            />
          </Field>
          <PasswordStrength password={password ?? ''} />
        </div>

        <Field label="Confirmar senha" error={form.formState.errors.confirmPassword?.message}>
          <PasswordInput
            placeholder="••••••••"
            autoComplete="new-password"
            error={!!form.formState.errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label className="flex min-h-touch cursor-pointer items-start gap-3 py-1 text-body-sm leading-[1.45] text-fg-muted">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              aria-invalid={!!consentError}
              {...form.register('consentAccepted')}
            />
            <span>
              Li e aceito a{' '}
              {/* Nova aba: navegar aqui descartaria o que já foi preenchido no formulário. */}
              <Link
                to={ROUTES.PRIVACY_POLICY}
                target="_blank"
                rel="noopener"
                className="cc-auth-link"
              >
                Política de Privacidade
              </Link>
            </span>
          </label>
          {consentError && (
            <div className="field">
              <div className="err" role="alert">
                {consentError}
              </div>
            </div>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isPending}>
          {isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>

        <div className="cc-auth-divider">ou</div>

        <GoogleSignInButton label="Continuar com Google" />
      </form>

      <p className="m-0 text-center text-[0.875rem] leading-[1.4] text-fg-muted">
        Já tem conta?{' '}
        <Link to={ROUTES.LOGIN} className="cc-auth-link">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}

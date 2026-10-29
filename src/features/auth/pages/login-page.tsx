import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Field } from '@/components/ui/field'
import { AuthLayout } from '@/features/auth/components/auth-layout'
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
    <AuthLayout>
      {/* Celular/tablet: a frase-chave abre a tela; no desktop ela vive no painel lateral. */}
      <div className="flex flex-col gap-2 lg:hidden">
        <p className="m-0 font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.01em] [text-wrap:balance]">
          Quanto gastei, quanto devo, o que vence.
        </p>
        <p className="m-0 text-[0.9375rem] leading-[1.45] text-fg-muted">Entre para ver seu mês.</p>
      </div>

      <div className="sr-only lg:not-sr-only lg:flex lg:flex-col lg:gap-2">
        <h1 className="m-0 font-display text-[2rem] font-extrabold leading-[1.1]">
          Bem-vindo de volta
        </h1>
        <p className="m-0 text-[0.9375rem] text-fg-muted">Entre para ver seu mês.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
            error={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <Field label="Senha" error={form.formState.errors.password?.message}>
            <PasswordInput
              placeholder="••••••••"
              autoComplete="current-password"
              error={!!form.formState.errors.password}
              {...form.register('password')}
            />
          </Field>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="cc-auth-link inline-flex min-h-touch items-center self-end text-body-sm"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isPending}>
          {isPending ? 'Entrando…' : 'Entrar'}
        </Button>

        <div className="cc-auth-divider">ou</div>

        <GoogleSignInButton label="Entrar com Google" />
      </form>

      <p className="m-0 text-center text-[0.875rem] leading-[1.4] text-fg-muted">
        Não tem conta?{' '}
        <Link to={ROUTES.REGISTER} className="cc-auth-link">
          Criar conta
        </Link>
      </p>

      <Link
        to={ROUTES.PRIVACY_POLICY}
        className="mt-2 self-center text-caption text-fg-muted underline-offset-2 hover:underline"
      >
        Política de privacidade
      </Link>
    </AuthLayout>
  )
}

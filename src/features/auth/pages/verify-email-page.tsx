import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, CircleX, LoaderCircle, Mail, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { AuthStatus, AuthStatusText } from '@/features/auth/components/auth-status'
import { resendVerificationSchema } from '@/features/auth/schemas/verify-email.schema'
import { useVerifyEmail } from '@/features/auth/hooks/use-verify-email'
import { useResendVerification } from '@/features/auth/hooks/use-resend-verification'
import { ROUTES } from '@/app/router/routes'
import type { ResendVerificationFormValues } from '@/features/auth/schemas/verify-email.schema'

function BackToLogin() {
  return (
    <Button asChild variant="ghost" size="lg" className="w-full">
      <Link to={ROUTES.LOGIN}>Voltar para login</Link>
    </Button>
  )
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const isPending = searchParams.get('pending') === 'true'

  const verifyMutation = useVerifyEmail()
  const resendMutation = useResendVerification()
  const hasVerified = useRef(false)

  const form = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    if (token && !hasVerified.current) {
      hasVerified.current = true
      verifyMutation.mutate(token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function onResendSubmit(data: ResendVerificationFormValues) {
    resendMutation.mutate(data.email)
  }

  const resendBlock = resendMutation.isSuccess ? (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-paid/30 bg-paid-soft p-4 text-body-sm leading-[1.5] text-fg"
    >
      <MailCheck size={20} className="mt-0.5 flex-none text-paid" aria-hidden="true" />
      <span>Se esse e-mail estiver cadastrado, você receberá um novo link em breve.</span>
    </div>
  ) : (
    <form onSubmit={form.handleSubmit(onResendSubmit)} noValidate className="flex flex-col gap-4">
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
        className="w-full"
        loading={resendMutation.isPending}
      >
        {resendMutation.isPending ? 'Enviando…' : 'Reenviar link'}
      </Button>
    </form>
  )

  return (
    <AuthLayout>
      {/* Recém-cadastrado: ainda sem token */}
      {isPending && !token && (
        <>
          <AuthStatus icon={Mail} tone="info" title="Verifique seu e-mail">
            <AuthStatusText>
              Enviamos um link de ativação para o seu e-mail. Clique no link para ativar sua conta.
            </AuthStatusText>
          </AuthStatus>
          <p className="m-0 rounded-lg border border-border bg-surface-1 p-4 text-center text-body-sm leading-[1.5] text-fg-muted">
            Não recebeu o e-mail? Verifique a pasta de spam ou solicite um novo link.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild variant="primary" size="lg" className="w-full">
              <Link to={ROUTES.VERIFY_EMAIL}>Reenviar link de verificação</Link>
            </Button>
            <BackToLogin />
          </div>
        </>
      )}

      {/* Verificando o token */}
      {token && verifyMutation.isPending && (
        <AuthStatus icon={LoaderCircle} tone="brand" title="Verificando e-mail" busy>
          <AuthStatusText>Aguarde enquanto confirmamos seu endereço de e-mail…</AuthStatusText>
        </AuthStatus>
      )}

      {/* Token confirmado */}
      {token && verifyMutation.isSuccess && (
        <>
          <AuthStatus icon={CircleCheck} tone="paid" title="E-mail verificado!">
            <AuthStatusText>
              {verifyMutation.data?.message || 'Sua conta foi ativada com sucesso.'}
            </AuthStatusText>
          </AuthStatus>
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link to={ROUTES.LOGIN}>Ir para o login</Link>
          </Button>
        </>
      )}

      {/* Token inválido/expirado: oferece reenvio */}
      {token && verifyMutation.isError && (
        <>
          <AuthStatus icon={CircleX} tone="overdue" title="Link inválido ou expirado">
            <AuthStatusText>
              Este link de verificação expirou ou já foi utilizado. Solicite um novo link abaixo.
            </AuthStatusText>
          </AuthStatus>
          {resendBlock}
          <BackToLogin />
        </>
      )}

      {/* Sem token na URL: só o formulário de reenvio */}
      {!token && !isPending && (
        <>
          <AuthStatus icon={Mail} tone="info" title="Reenviar verificação">
            <AuthStatusText>
              Informe seu e-mail para receber um novo link de verificação.
            </AuthStatusText>
          </AuthStatus>
          {resendBlock}
          <BackToLogin />
        </>
      )}
    </AuthLayout>
  )
}

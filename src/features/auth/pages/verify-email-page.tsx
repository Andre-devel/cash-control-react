import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { AuthAside } from '@/features/auth/components/auth-aside'
import { resendVerificationSchema } from '@/features/auth/schemas/verify-email.schema'
import { useVerifyEmail } from '@/features/auth/hooks/use-verify-email'
import { useResendVerification } from '@/features/auth/hooks/use-resend-verification'
import { ROUTES } from '@/app/router/routes'
import type { ResendVerificationFormValues } from '@/features/auth/schemas/verify-email.schema'

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

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          {/* Pending state: just registered, no token yet */}
          {isPending && !token && (
            <>
              <h1>Verifique seu e-mail</h1>
              <div className="sub">
                Enviamos um link de ativação para o seu e-mail. Clique no link para ativar sua
                conta.
              </div>
              <div className="col" style={{ gap: 12, marginTop: 8 }}>
                <div
                  className="card"
                  style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-muted)' }}
                >
                  Não recebeu o e-mail? Verifique a pasta de spam ou solicite um novo link abaixo.
                </div>
              </div>
              <div className="auth-foot">
                <Link to={ROUTES.VERIFY_EMAIL} className="link">
                  Reenviar link de verificação
                </Link>
              </div>
            </>
          )}

          {/* Token verification in progress */}
          {token && verifyMutation.isPending && (
            <>
              <h1>Verificando e-mail</h1>
              <div className="sub">Aguarde enquanto confirmamos seu endereço de e-mail…</div>
            </>
          )}

          {/* Token verification success */}
          {token && verifyMutation.isSuccess && (
            <>
              <h1>E-mail verificado!</h1>
              <div className="sub">
                {verifyMutation.data?.message || 'Sua conta foi ativada com sucesso.'}
              </div>
              <Link to={ROUTES.LOGIN}>
                <Button variant="primary" size="lg" style={{ marginTop: 16, width: '100%' }}>
                  Ir para o login
                </Button>
              </Link>
            </>
          )}

          {/* Token verification failure — show resend form */}
          {token && verifyMutation.isError && (
            <>
              <h1>Link inválido ou expirado</h1>
              <div className="sub">
                Este link de verificação expirou ou já foi utilizado. Solicite um novo link abaixo.
              </div>

              {resendMutation.isSuccess ? (
                <div className="card" style={{ padding: '12px 16px', fontSize: 14, marginTop: 8 }}>
                  Se esse e-mail estiver cadastrado, você receberá um novo link em breve.
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(onResendSubmit)}
                  noValidate
                  className="col"
                  style={{ gap: 14, marginTop: 8 }}
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
                    disabled={resendMutation.isPending}
                    aria-busy={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? 'Enviando…' : 'Reenviar link'}
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Resend form only (no token in URL) */}
          {!token && !isPending && (
            <>
              <h1>Reenviar verificação</h1>
              <div className="sub">
                Informe seu e-mail para receber um novo link de verificação.
              </div>

              {resendMutation.isSuccess ? (
                <div className="card" style={{ padding: '12px 16px', fontSize: 14, marginTop: 8 }}>
                  Se esse e-mail estiver cadastrado, você receberá um novo link em breve.
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit(onResendSubmit)}
                  noValidate
                  className="col"
                  style={{ gap: 14, marginTop: 8 }}
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
                    disabled={resendMutation.isPending}
                    aria-busy={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? 'Enviando…' : 'Reenviar link'}
                  </Button>
                </form>
              )}
            </>
          )}

          <div className="auth-foot">
            <Link to={ROUTES.LOGIN} className="link">
              Voltar para login
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

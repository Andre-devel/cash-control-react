import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LoaderCircle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/components/auth-layout'
import { AuthStatus, AuthStatusText } from '@/features/auth/components/auth-status'
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button'
import { getMeApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { refreshAccessToken } from '@/services/http'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

/**
 * Landing page after the API finishes the Google OAuth2 flow. The API only sets the
 * refresh cookie, so the access token is obtained here through /auth/refresh.
 * Also serves the failure redirect, which arrives with ?error=.
 */
export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [failed, setFailed] = useState(searchParams.has('error'))
  const started = useRef(false)

  useEffect(() => {
    if (failed || started.current) return
    started.current = true

    async function completeSignIn() {
      try {
        await refreshAccessToken()
        const profile = await getMeApi()
        setUser({
          id: profile.id,
          email: profile.maskedEmail,
          name: profile.displayName,
          roles: profile.roles,
          permissions: profile.permissions,
        })
        logger.log({ event: LOG_EVENTS.LOGIN_SUCCESS, permissions: profile.permissions })
        navigate(ROUTES.DASHBOARD, { replace: true })
      } catch {
        logger.log({ event: LOG_EVENTS.LOGIN_FAILURE })
        clearSession()
        setFailed(true)
      }
    }

    void completeSignIn()
  }, [failed, navigate, setUser, clearSession])

  const errorCode = searchParams.get('error')

  return (
    <AuthLayout>
      {failed ? (
        <>
          <AuthStatus icon={ShieldAlert} tone="overdue" title="Não foi possível entrar com Google">
            <AuthStatusText>
              {errorCode === 'account_unavailable'
                ? 'Sua conta está bloqueada ou indisponível. Fale com o suporte se acha que isso é um engano.'
                : 'O login com Google não foi concluído. Tente novamente ou entre com e-mail e senha.'}
            </AuthStatusText>
            {errorCode && (
              <span className="rounded-sm bg-surface-2 px-2 py-1 font-mono text-caption text-fg-muted">
                código: {errorCode}
              </span>
            )}
          </AuthStatus>
          <div className="flex flex-col gap-3">
            {errorCode !== 'account_unavailable' && (
              <GoogleSignInButton label="Tentar novamente com Google" />
            )}
            <Button asChild variant="ghost" size="lg" className="w-full">
              <Link to={ROUTES.LOGIN}>Voltar para login</Link>
            </Button>
          </div>
        </>
      ) : (
        <AuthStatus icon={LoaderCircle} tone="brand" title="Entrando…" busy>
          <AuthStatusText>Conectando com o Google. Isso leva só alguns segundos.</AuthStatusText>
        </AuthStatus>
      )}
    </AuthLayout>
  )
}

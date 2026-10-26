import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthAside } from '@/features/auth/components/auth-aside'
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

  return (
    <div className="auth-shell">
      <AuthAside />

      <main className="auth-main">
        <div className="auth-card">
          {failed ? (
            <>
              <h1>Não foi possível entrar com Google</h1>
              <div className="sub">
                {searchParams.get('error') === 'account_unavailable'
                  ? 'Sua conta está bloqueada ou indisponível. Fale com o suporte se acha que isso é um engano.'
                  : 'O login com Google não foi concluído. Tente novamente ou entre com e-mail e senha.'}
              </div>
            </>
          ) : (
            <>
              <h1>Entrando…</h1>
              <div className="sub">Aguarde enquanto concluímos seu login com Google.</div>
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

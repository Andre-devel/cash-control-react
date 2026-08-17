import { useAuthStore } from '@/features/auth/store/auth.store'
import { refreshAccessToken } from '@/services/http'
import { decodeJwtPayload } from '@/lib/jwt'

/** Renew this far ahead of expiry so in-flight requests never race the deadline. */
const REFRESH_MARGIN_MS = 60_000

let timer: ReturnType<typeof setTimeout> | null = null
let unsubscribe: (() => void) | null = null

function millisecondsUntilRefresh(token: string): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return null
  return payload.exp * 1000 - REFRESH_MARGIN_MS - Date.now()
}

function renew(): void {
  void refreshAccessToken().catch(() => {
    // The next request's 401 handler owns the logout decision
  })
}

function reschedule(token: string | null): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (!token) return

  const delay = millisecondsUntilRefresh(token)
  if (delay === null) return

  timer = setTimeout(renew, Math.max(delay, 0))
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return

  const { token } = useAuthStore.getState()
  if (!token) return

  // Background tabs throttle timers and suspended machines skip them entirely,
  // so the deadline may already have passed while the tab was hidden.
  const delay = millisecondsUntilRefresh(token)
  if (delay !== null && delay <= 0) {
    renew()
  }
}

export function startTokenRefreshScheduler(): void {
  if (unsubscribe) return

  unsubscribe = useAuthStore.subscribe((state, previous) => {
    if (state.token !== previous.token) {
      reschedule(state.token)
    }
  })
  document.addEventListener('visibilitychange', onVisibilityChange)

  reschedule(useAuthStore.getState().token)
}

export function stopTokenRefreshScheduler(): void {
  unsubscribe?.()
  unsubscribe = null
  document.removeEventListener('visibilitychange', onVisibilityChange)
  reschedule(null)
}

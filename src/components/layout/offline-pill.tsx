import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** Aviso fixo abaixo do header enquanto o aparelho estiver sem conexão (o app é PWA). */
export function OfflinePill() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
  if (online) return null
  return (
    <div className="offline-pill" role="status">
      <WifiOff size={14} aria-hidden="true" />
      Sem conexão — mostrando dados salvos
    </div>
  )
}

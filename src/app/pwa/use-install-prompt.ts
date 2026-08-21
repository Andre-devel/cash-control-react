import { useEffect, useState } from 'react'

/** Não é padrão do DOM lib do TS ainda — o evento é real, o tipo é que falta. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Expõe o prompt de instalação do PWA.
 *
 * Sem o app instalado, o Web Share Target nunca aparece na folha de compartilhar do banco
 * — instalar não é um extra desta feature, é pré-condição. O Chrome só dispara
 * `beforeinstallprompt` quando o app passa nos critérios de instalabilidade (manifest,
 * service worker, HTTPS) e ainda não está instalado; por isso o hook começa com
 * `canInstall: false` e só liga depois que o evento chega.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    // O evento só dispara uma vez por sessão de navegação; usado ou recusado, some.
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  return { canInstall: deferredPrompt !== null, promptInstall }
}

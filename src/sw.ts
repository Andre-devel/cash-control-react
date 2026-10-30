/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { stashSharedFile } from '@/app/pwa/shared-file-store'
import { createBankNotifications, type BankPush } from '@/app/pwa/bank-notifications'

declare const self: ServiceWorkerGlobalScope & {
  // Placeholder que o build do vite-plugin-pwa substitui pela lista real de assets
  // pré-cacheados; não existe em tempo de execução fora do bundle gerado.
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>
}

// Exigido pelo vite-plugin-pwa em modo injectManifest: sem isto o build falha e, mais
// importante, o browser não considera o app instalável.
precacheAndRoute(self.__WB_MANIFEST)

// Vale já na primeira instalação — sem isto, o usuário precisaria fechar e reabrir o app
// uma vez antes do share target funcionar, o que anula o efeito de "instalei, já funciona".
self.skipWaiting()
self.addEventListener('activate', () => {
  void self.clients.claim()
})

const SHARE_TARGET_PATH = '/share-target'

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'POST' || url.pathname !== SHARE_TARGET_PATH) {
    return
  }

  event.respondWith(
    (async () => {
      const formData = await event.request.formData()
      const file = formData.get('file')
      const text = formData.get('text')

      if (file instanceof Blob) {
        await stashSharedFile(
          file,
          file instanceof File && file.name ? file.name : 'comprovante',
          typeof text === 'string' ? text : null,
        )
      }

      // 303 (não 302): troca o método da navegação seguinte para GET, que é o que a
      // página /share-target espera — sem isto o browser tentaria reenviar o POST.
      return Response.redirect(new URL(`${SHARE_TARGET_PATH}?ready=1`, self.location.origin), 303)
    })(),
  )
})

// ── Notificações de lançamento do banco (etapa 6A) ───────────────────────────
// A lógica fica em bank-notifications.ts, testável fora do service worker.

const notifications = createBankNotifications({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  origin: self.location.origin,
  fetch: (input, init) => fetch(input, init),
  showNotification: (title, options) => self.registration.showNotification(title, options),
  clients: self.clients,
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() as BankPush | undefined
  if (data) event.waitUntil(notifications.show(data))
})

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data as BankPush | undefined
  event.notification.close()
  event.waitUntil(notifications.click(event.action, data))
})

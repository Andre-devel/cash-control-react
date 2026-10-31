import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPushConfig,
  listPushDevices,
  subscribePush,
  unsubscribePush,
} from '@/features/bank-connections/api/push.api'
import { toast } from '@/lib/toast'

const PUSH_QUERY_KEY = ['push'] as const

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Chave VAPID em base64url → bytes, o formato que `pushManager.subscribe` aceita. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + '='.repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

/** "Android · Chrome": só para o usuário reconhecer o aparelho na lista. */
export function deviceLabel(userAgent: string): string {
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad/.test(userAgent)
      ? 'iOS'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : 'Linux'
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : 'Navegador'
  return `${os} · ${browser}`
}

async function currentSubscription(): Promise<PushSubscription | null> {
  // getRegistration, não `ready`: sem service worker (dev) `ready` nunca resolve.
  const registration = await navigator.serviceWorker.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

/**
 * Notificações deste aparelho. Só o aparelho que liga recebe: a inscrição é do navegador,
 * e o servidor guarda uma por aparelho.
 */
export function usePushNotifications() {
  const supported = isPushSupported()
  const queryClient = useQueryClient()
  const config = useQuery({
    queryKey: [...PUSH_QUERY_KEY, 'config'],
    queryFn: getPushConfig,
    enabled: supported,
  })
  const enabledOnServer = config.data?.enabled === true
  const devices = useQuery({
    queryKey: [...PUSH_QUERY_KEY, 'devices'],
    queryFn: listPushDevices,
    enabled: enabledOnServer,
  })
  const [endpoint, setEndpoint] = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return
    let active = true
    void currentSubscription().then((subscription) => {
      if (active) setEndpoint(subscription?.endpoint ?? null)
    })
    return () => {
      active = false
    }
  }, [supported])

  const device = devices.data?.find((d) => d.endpoint === endpoint) ?? null

  const save = useMutation<void, Error, { hideAmounts: boolean; budgetAlerts: boolean }>({
    mutationFn: async ({ hideAmounts, budgetAlerts }) => {
      if ((await Notification.requestPermission()) !== 'granted') {
        throw new Error('Permita as notificações do Cash Control nas configurações do navegador.')
      }
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration || !config.data?.publicKey) {
        throw new Error('Instale o app (ou recarregue a página) para ligar as notificações.')
      }
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(config.data.publicKey),
        }))
      const keys = subscription.toJSON().keys ?? {}
      await subscribePush({
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh ?? '',
        auth: keys.auth ?? '',
        deviceLabel: deviceLabel(navigator.userAgent),
        hideAmounts,
        budgetAlerts,
      })
      setEndpoint(subscription.endpoint)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEY }),
    onError: (error) => toast.error(error.message),
  })

  const disable = useMutation<void, Error, void>({
    mutationFn: async () => {
      const subscription = await currentSubscription()
      if (!subscription) return
      await unsubscribePush(subscription.endpoint)
      await subscription.unsubscribe()
      setEndpoint(null)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PUSH_QUERY_KEY }),
    onError: (error) => toast.error(error.message),
  })

  const hideAmounts = device?.hideAmounts ?? false
  const budgetAlerts = device?.budgetAlerts ?? false

  return {
    supported,
    available: enabledOnServer,
    on: device !== null,
    hideAmounts,
    budgetAlerts,
    pending: save.isPending || disable.isPending,
    enable: (hide = false) => save.mutate({ hideAmounts: hide, budgetAlerts: false }),
    setHideAmounts: (hide: boolean) => save.mutate({ hideAmounts: hide, budgetAlerts }),
    setBudgetAlerts: (alerts: boolean) => save.mutate({ hideAmounts, budgetAlerts: alerts }),
    disable: () => disable.mutate(),
  }
}

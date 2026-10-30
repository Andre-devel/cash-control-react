import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { NotificationsSection } from '../notifications-section'
import {
  base64UrlToBytes,
  deviceLabel,
} from '@/features/bank-connections/hooks/use-push-notifications'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/device-1'

let current: { endpoint: string; toJSON: () => unknown; unsubscribe: () => Promise<boolean> } | null
const subscribe = vi.fn()
const unsubscribe = vi.fn(async () => true)

function browserSubscription() {
  return {
    endpoint: ENDPOINT,
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: 'p256', auth: 'auth' } }),
    unsubscribe,
  }
}

function mockBrowser(permission: 'granted' | 'denied') {
  current = null
  subscribe.mockImplementation(async () => {
    current = browserSubscription()
    return current
  })
  vi.stubGlobal('PushManager', class {})
  vi.stubGlobal('Notification', { requestPermission: vi.fn(async () => permission) })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: async () => ({
        pushManager: { getSubscription: async () => current, subscribe },
      }),
    },
  })
}

function mockServer(enabled = true, devices: unknown[] = []) {
  server.use(
    http.get('*/push/vapid-key', () =>
      HttpResponse.json({ enabled, publicKey: enabled ? 'BAAA' : null }),
    ),
    http.get('*/push/subscriptions', () => HttpResponse.json(devices)),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NotificationsSection', () => {
  it('stays hidden when the server has no push keys', async () => {
    mockBrowser('granted')
    mockServer(false)
    const { container } = renderWithProviders(<NotificationsSection />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('does not subscribe when the user denies the permission', async () => {
    mockBrowser('denied')
    mockServer()
    let posted = false
    server.use(
      http.post('*/push/subscriptions', () => {
        posted = true
        return HttpResponse.json({})
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<NotificationsSection />)

    await user.click(await screen.findByRole('button', { name: 'Notificações neste aparelho' }))

    const { toast } = await import('@/lib/toast')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Permita/)))
    expect(subscribe).not.toHaveBeenCalled()
    expect(posted).toBe(false)
  })

  it('turns on: subscribes this browser and sends its keys to the server', async () => {
    mockBrowser('granted')
    mockServer()
    let body: unknown
    server.use(
      http.post('*/push/subscriptions', async ({ request }) => {
        body = await request.json()
        mockServer(true, [
          { endpoint: ENDPOINT, deviceLabel: 'x', hideAmounts: false, createdAt: '' },
        ])
        return HttpResponse.json({})
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<NotificationsSection />)

    await user.click(await screen.findByRole('button', { name: 'Notificações neste aparelho' }))

    await waitFor(() =>
      expect(body).toMatchObject({
        endpoint: ENDPOINT,
        p256dh: 'p256',
        auth: 'auth',
        hideAmounts: false,
      }),
    )
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }))
    expect(
      await screen.findByRole('button', { name: 'Esconder valores na notificação' }),
    ).toBeInTheDocument()
  })

  it('turns off: removes the device on the server and in the browser', async () => {
    mockBrowser('granted')
    current = browserSubscription()
    mockServer(true, [{ endpoint: ENDPOINT, deviceLabel: 'x', hideAmounts: false, createdAt: '' }])
    let deleted: unknown
    server.use(
      http.delete('*/push/subscriptions', async ({ request }) => {
        deleted = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<NotificationsSection />)

    const toggle = await screen.findByRole('button', { name: 'Notificações neste aparelho' })
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'))
    await user.click(toggle)

    await waitFor(() => expect(deleted).toEqual({ endpoint: ENDPOINT }))
    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('push helpers', () => {
  it('decodes the base64url VAPID key', () => {
    expect(Array.from(base64UrlToBytes('AQID_-8'))).toEqual([1, 2, 3, 255, 239])
  })

  it('names the device by system and browser', () => {
    expect(
      deviceLabel(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
      ),
    ).toBe('Android · Chrome')
  })
})

import { describe, it, expect, vi } from 'vitest'
import {
  createBankNotifications,
  notificationOf,
  SUMMARY_TAG,
  type PendingPush,
} from '../bank-notifications'

const PENDING: PendingPush = {
  type: 'pending',
  pendingId: 'p-1',
  token: 'tok-1',
  title: 'Pix enviado · −R$ 10,00',
  body: 'Padaria → Alimentação?',
}

function setup(response?: Response | Error, windows: { url: string }[] = []) {
  const open = windows.map((w) => ({
    ...w,
    focus: vi.fn(async () => {}),
    navigate: vi.fn(async () => {}),
  }))
  const deps = {
    apiBaseUrl: 'https://app.test/api/v1',
    origin: 'https://app.test',
    fetch: vi.fn(async () => {
      if (response instanceof Error) throw response
      return response ?? new Response(null, { status: 404 })
    }),
    showNotification: vi.fn(async () => {}),
    clients: { matchAll: vi.fn(async () => open), openWindow: vi.fn(async () => null) },
  }
  return { deps, open, notifications: createBankNotifications(deps) }
}

describe('notificationOf', () => {
  it('gives each pending transaction its own tag and both buttons', () => {
    const options = notificationOf(PENDING)
    expect(options.tag).toBe('p-1')
    expect(options.actions?.map((a) => a.action)).toEqual(['confirm', 'review'])
  })

  it('makes the summary replace itself and only offers review', () => {
    const options = notificationOf({ type: 'summary', count: 5, title: '5 lançamentos', body: 'x' })
    expect(options.tag).toBe(SUMMARY_TAG)
    expect(options.renotify).toBe(true)
    expect(options.actions?.map((a) => a.action)).toEqual(['review'])
  })
})

describe('createBankNotifications', () => {
  it('confirms with the one-time token and shows what was saved', async () => {
    const { deps, notifications } = setup(
      Response.json({ description: 'Padaria', categoryName: 'Alimentação' }),
    )

    await notifications.click('confirm', PENDING)

    expect(deps.fetch).toHaveBeenCalledWith(
      'https://app.test/api/v1/bank-pending/p-1/confirm-by-token',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'tok-1' }) }),
    )
    expect(deps.showNotification).toHaveBeenCalledWith(
      '✓ Gravado',
      expect.objectContaining({ body: 'Padaria · Alimentação', tag: 'p-1' }),
    )
    expect(deps.clients.openWindow).not.toHaveBeenCalled()
  })

  it('opens the review queue when the token is refused or the network fails', async () => {
    const refused = setup(new Response(null, { status: 404 }))
    await refused.notifications.click('confirm', PENDING)
    expect(refused.deps.clients.openWindow).toHaveBeenCalledWith('https://app.test/revisar')

    const offline = setup(new Error('offline'))
    await offline.notifications.click('confirm', PENDING)
    expect(offline.deps.clients.openWindow).toHaveBeenCalledWith('https://app.test/revisar')
  })

  it('reuses an open window of the app to show the queue', async () => {
    const { deps, open, notifications } = setup(undefined, [{ url: 'https://app.test/dashboard' }])

    await notifications.click('review', PENDING)

    expect(open[0].focus).toHaveBeenCalled()
    expect(open[0].navigate).toHaveBeenCalledWith('https://app.test/revisar')
    expect(deps.fetch).not.toHaveBeenCalled()
    expect(deps.clients.openWindow).not.toHaveBeenCalled()
  })
})

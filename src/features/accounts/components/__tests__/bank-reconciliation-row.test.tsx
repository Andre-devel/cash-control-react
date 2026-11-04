import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_ACCOUNT_1, resetAccountsStore } from '@/test/handlers/accounts.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import { formatTimeAgo } from '@/lib/format-date'
import { toast } from '@/lib/toast'
import type * as ReactRouterDom from 'react-router-dom'
import { BankReconciliationRow } from '../bank-reconciliation-row'
import AccountsPage from '@/features/accounts/pages/accounts-page'
import type { AccountReconciliation } from '@/features/accounts/types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouterDom>()),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000 - 60_000).toISOString()

function mockReconciliation(data: AccountReconciliation, onGet?: () => void) {
  server.use(
    http.get('*/accounts/:id/reconciliation', () => {
      onGet?.()
      return HttpResponse.json(data)
    }),
  )
}

const WITH_DIFFERENCE: AccountReconciliation = {
  appBalance: '1321.64',
  bankBalance: '1302.39',
  bankBalanceAt: TWO_HOURS_AGO,
  difference: '-19.25',
}

beforeEach(() => {
  resetAccountsStore()
  useHideValuesStore.setState({ hidden: false })
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('BankReconciliationRow', () => {
  it('renders nothing when the bank has not reported a balance', async () => {
    const onGet = vi.fn()
    mockReconciliation(
      { appBalance: '1500.00', bankBalance: null, bankBalanceAt: null, difference: null },
      onGet,
    )
    const { container } = renderWithProviders(<BankReconciliationRow accountId="account-1" />)
    await waitFor(() => expect(onGet).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(container.textContent).toBe('')
    expect(screen.queryByRole('button', { name: /ajustar/i })).toBeNull()
  })

  it('shows that it matches the bank and how long ago it was read', async () => {
    mockReconciliation({
      appBalance: '1500.00',
      bankBalance: '1500.00',
      bankBalanceAt: TWO_HOURS_AGO,
      difference: '0.00',
    })
    renderWithProviders(<BankReconciliationRow accountId="account-1" />)
    expect(await screen.findByText('Confere com o banco · há 2 h')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /ajustar/i })).toBeNull()
  })

  it('shows bank, app and difference, and posts the reconcile after confirming', async () => {
    const user = userEvent.setup()
    const onPost = vi.fn()
    const reconciled = { ...WITH_DIFFERENCE, appBalance: '1302.39', difference: '0.00' }
    let current = WITH_DIFFERENCE
    server.use(
      http.get('*/accounts/:id/reconciliation', () => HttpResponse.json(current)),
      http.post('*/accounts/:id/reconcile', ({ params }) => {
        onPost(params.id)
        current = reconciled
        return HttpResponse.json(reconciled)
      }),
    )
    renderWithProviders(<BankReconciliationRow accountId="account-1" />)

    const button = await screen.findByRole('button', { name: 'Ajustar' })
    const row = button.parentElement!
    expect(row.textContent).toContain('Banco: R$1.302,39')
    expect(row.textContent).toContain('App: R$1.321,64')
    expect(row.textContent).toContain('diferença −R$19,25')

    await user.click(button)
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain(
      'Cria um ajuste de −R$19,25 para a conta bater com o banco',
    )

    await user.click(screen.getByRole('button', { name: 'Confirmar ajuste' }))
    await waitFor(() => expect(onPost).toHaveBeenCalledWith('account-1'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(toast.success).toHaveBeenCalledWith('Saldo ajustado para bater com o banco.')
    expect(await screen.findByText('Confere com o banco · há 2 h')).toBeTruthy()
  })

  it('reports a failed reconcile and keeps the sheet open', async () => {
    const user = userEvent.setup()
    mockReconciliation(WITH_DIFFERENCE)
    server.use(
      http.post('*/accounts/:id/reconcile', () =>
        HttpResponse.json(
          { errorCode: 'BANK_BALANCE_UNAVAILABLE', message: 'Sem saldo do banco.' },
          { status: 422 },
        ),
      ),
    )
    renderWithProviders(<BankReconciliationRow accountId="account-1" />)
    await user.click(await screen.findByRole('button', { name: 'Ajustar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar ajuste' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('hides the amounts when "esconder valores" is on', async () => {
    useHideValuesStore.setState({ hidden: true })
    mockReconciliation(WITH_DIFFERENCE)
    renderWithProviders(<BankReconciliationRow accountId="account-1" />)
    const button = await screen.findByRole('button', { name: 'Ajustar' })
    const row = button.parentElement!
    expect(row.textContent).not.toMatch(/\d/)
    expect(screen.getAllByText('Valor oculto')).toHaveLength(3)
  })

  it('the adjust button inside the account card does not open the detail', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/accounts/:id/reconciliation', ({ params }) =>
        HttpResponse.json(
          params.id === MOCK_ACCOUNT_1.id
            ? WITH_DIFFERENCE
            : { appBalance: '0', bankBalance: null, bankBalanceAt: null, difference: null },
        ),
      ),
    )
    renderWithProviders(<AccountsPage />)
    await user.click(await screen.findByRole('button', { name: 'Ajustar' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

describe('formatTimeAgo', () => {
  const now = new Date('2026-11-04T12:00:00Z')

  it('formats minutes, hours and days', () => {
    expect(formatTimeAgo('2026-11-04T11:59:40Z', now)).toBe('agora')
    expect(formatTimeAgo('2026-11-04T11:55:00Z', now)).toBe('há 5 min')
    expect(formatTimeAgo('2026-11-04T10:00:00Z', now)).toBe('há 2 h')
    expect(formatTimeAgo('2026-11-03T11:00:00Z', now)).toBe('há 1 dia')
    expect(formatTimeAgo('2026-11-01T12:00:00Z', now)).toBe('há 3 dias')
  })

  it('falls back on missing or invalid input', () => {
    expect(formatTimeAgo(null, now)).toBe('—')
    expect(formatTimeAgo('nope', now)).toBe('nope')
  })
})

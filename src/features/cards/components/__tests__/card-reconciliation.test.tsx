import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { useHideValuesStore } from '@/lib/hide-values'
import { toast } from '@/lib/toast'
import { CardBankReconciliation } from '../limit-usage-bar'
import type { CardReconciliation } from '@/features/accounts/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const LINKED: CardReconciliation = {
  bankLimit: '5000.00',
  bankAvailable: '3480.75',
  bankUsed: '1519.25',
  appUsed: '1500.00',
  difference: '19.25',
  openInvoiceId: 'invoice-1',
}

function mockReconciliation(data: CardReconciliation, onGet?: () => void) {
  server.use(
    http.get('*/cards/:id/reconciliation', () => {
      onGet?.()
      return HttpResponse.json(data)
    }),
  )
}

beforeEach(() => {
  useHideValuesStore.setState({ hidden: false })
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('CardBankReconciliation', () => {
  it('renders nothing when the card has no bank limit', async () => {
    const onGet = vi.fn()
    mockReconciliation(
      {
        bankLimit: null,
        bankAvailable: null,
        bankUsed: null,
        appUsed: '1500.00',
        difference: null,
        openInvoiceId: null,
      },
      onGet,
    )
    const { container } = renderWithProviders(<CardBankReconciliation cardId="card-1" />)
    await waitFor(() => expect(onGet).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(container.textContent).toBe('')
  })

  it('shows the bank limit and available without a warning when it matches', async () => {
    mockReconciliation({ ...LINKED, appUsed: '1519.25', difference: '0.00' })
    renderWithProviders(<CardBankReconciliation cardId="card-1" />)
    const limit = await screen.findByText('Limite no banco')
    expect(limit.parentElement!.textContent).toContain('R$5.000,00')
    expect(screen.getByText('Disponível no banco').parentElement!.textContent).toContain(
      'R$3.480,75',
    )
    expect(screen.queryByText(/a fatura no banco/i)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Lançar diferença' })).toBeNull()
  })

  it('warns about the difference and sends the edited description', async () => {
    const user = userEvent.setup()
    const onPost = vi.fn()
    mockReconciliation(LINKED)
    server.use(
      http.post('*/cards/:id/reconcile', async ({ params, request }) => {
        onPost(params.id, await request.json())
        return HttpResponse.json({ id: 'item-1' }, { status: 201 })
      }),
    )
    renderWithProviders(<CardBankReconciliation cardId="card-1" />)

    const warning = await screen.findByText(/a fatura no banco está/i)
    expect(warning.textContent).toBe('A fatura no banco está R$19,25 acima')

    await user.click(screen.getByRole('button', { name: 'Lançar diferença' }))
    const description = await screen.findByLabelText('Descrição')
    expect((description as HTMLInputElement).value).toBe('IOF e tarifas')

    await user.clear(description)
    await user.type(description, 'IOF da compra internacional')
    await user.click(screen.getByRole('button', { name: 'Lançar' }))

    await waitFor(() =>
      expect(onPost).toHaveBeenCalledWith('card-1', {
        amount: '19.25',
        description: 'IOF da compra internacional',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(toast.success).toHaveBeenCalledWith('Diferença lançada na fatura aberta.')
  })

  it('does not offer the adjustment when the bank invoice is below the app', async () => {
    mockReconciliation({ ...LINKED, bankUsed: '1480.00', difference: '-20.00' })
    renderWithProviders(<CardBankReconciliation cardId="card-1" />)
    const warning = await screen.findByText(/a fatura no banco está/i)
    expect(warning.textContent).toBe('A fatura no banco está R$20,00 abaixo')
    expect(screen.queryByRole('button', { name: 'Lançar diferença' })).toBeNull()
  })

  it('reports a failed adjustment', async () => {
    const user = userEvent.setup()
    mockReconciliation(LINKED)
    server.use(
      http.post('*/cards/:id/reconcile', () =>
        HttpResponse.json(
          { errorCode: 'CARD_ARCHIVED', message: 'Cartão arquivado.' },
          { status: 422 },
        ),
      ),
    )
    renderWithProviders(<CardBankReconciliation cardId="card-1" />)
    await user.click(await screen.findByRole('button', { name: 'Lançar diferença' }))
    await user.click(screen.getByRole('button', { name: 'Lançar' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('hides the amounts when "esconder valores" is on', async () => {
    useHideValuesStore.setState({ hidden: true })
    mockReconciliation(LINKED)
    const { container } = renderWithProviders(<CardBankReconciliation cardId="card-1" />)
    await screen.findByRole('button', { name: 'Lançar diferença' })
    expect(container.textContent).not.toMatch(/\d/)
    expect(screen.getAllByText('Valor oculto')).toHaveLength(3)
  })
})

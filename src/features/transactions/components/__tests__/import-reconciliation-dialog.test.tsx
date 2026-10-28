import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import type {
  ApplyReconciliationRequest,
  ImportReconciliationResponse,
} from '@/features/transactions/types'
import { ImportReconciliationDialog } from '../import-reconciliation-dialog'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const PREVIEW: ImportReconciliationResponse = {
  investmentAccountMissing: false,
  proposals: [
    {
      kind: 'INVOICE_PAYMENT',
      id: 'tx-fatura',
      date: '2026-09-10',
      description: 'Pagamento Fatura - FULANO',
      amount: '1617.29',
      accountName: 'Conta Inter',
      detail: 'Vira pagamento da fatura Inter que vence em 10/09/2026 (sai das despesas)',
    },
    {
      kind: 'INVESTMENT',
      id: 'tx-cdb',
      date: '2026-04-13',
      description: 'Cdb Porq Obj Banco Inter Sa',
      amount: '413.00',
      accountName: 'Conta Inter',
      detail: 'Vira transferência para Investimentos',
    },
  ],
}

function givenPreview(preview: ImportReconciliationResponse) {
  let applied: ApplyReconciliationRequest | null = null
  server.use(
    http.get('*/transactions/import/reconciliation', () => HttpResponse.json(preview)),
    http.post('*/transactions/import/reconciliation', async ({ request }) => {
      applied = (await request.json()) as ApplyReconciliationRequest
      return HttpResponse.json({ invoicePayments: 1, investments: 0, seriesMerged: 0, skipped: 0 })
    }),
  )
  return () => applied
}

afterEach(() => cleanup())

describe('ImportReconciliationDialog', () => {
  it('lists every proposal grouped by kind, all checked', async () => {
    givenPreview(PREVIEW)
    renderWithProviders(<ImportReconciliationDialog open onClose={vi.fn()} />)

    expect(
      await screen.findByRole('region', { name: /pagamentos de fatura lançados como despesa/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /aplicações e resgates/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aplicar 2 correções/i })).toBeEnabled()
  })

  it('sends only the proposals left checked', async () => {
    const applied = givenPreview(PREVIEW)
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ImportReconciliationDialog open onClose={onClose} />)

    await user.click(await screen.findByRole('checkbox', { name: /corrigir cdb porq obj/i }))
    await user.click(screen.getByRole('button', { name: /aplicar 1 correções/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(applied()).toEqual({ items: [{ kind: 'INVOICE_PAYMENT', id: 'tx-fatura' }] })
  })

  it('offers to create the investment account when it is missing', async () => {
    givenPreview({ investmentAccountMissing: true, proposals: [] })
    renderWithProviders(<ImportReconciliationDialog open onClose={vi.fn()} />)

    expect(
      await screen.findByRole('button', { name: /criar conta "investimentos"/i }),
    ).toBeInTheDocument()
  })

  it('says when there is nothing to fix', async () => {
    givenPreview({ investmentAccountMissing: false, proposals: [] })
    renderWithProviders(<ImportReconciliationDialog open onClose={vi.fn()} />)

    expect(await screen.findByText(/nada a corrigir/i)).toBeInTheDocument()
  })
})

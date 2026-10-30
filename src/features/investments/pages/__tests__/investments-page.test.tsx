import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import type {
  FixedIncomeHolding,
  InvestmentSummary,
  MarketIndexes,
  PendingInvestmentTransfer,
} from '@/features/investments/types'
import InvestmentsPage from '../investments-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

const HOLDING: FixedIncomeHolding = {
  id: 'h-1',
  accountId: 'inv-1',
  accountName: 'Investimentos',
  kind: 'CDB',
  indexer: 'CDI_PERCENT',
  rate: 110,
  name: 'CDB Inter',
  issuer: 'Banco Inter',
  taxExempt: false,
  liquidity: 'DAILY',
  appliedAt: '2026-04-13',
  maturityDate: null,
  principal: 1000,
  remainingPrincipal: 1000,
  treasuryBondType: null,
  treasuryQuantity: null,
  manualValue: null,
  manualValueDate: null,
  status: 'ACTIVE',
  notes: null,
  valuation: {
    valuedAt: '2026-10-30',
    principal: 1000,
    gross: 1072.41,
    incomeTax: 14.48,
    iof: 0,
    net: 1057.93,
    yield: 72.41,
    incomeTaxRate: 20,
    iofRate: 0,
    daysHeld: 200,
    estimated: false,
    source: 'CURVE',
  },
  yieldPercent: 7.24,
  cdiPercent: 110.4,
  daysToMaturity: null,
  redemptions: [],
}

const SUMMARY: InvestmentSummary = {
  totalPrincipal: 1000,
  totalGross: 1072.41,
  totalIncomeTax: 14.48,
  totalIof: 0,
  totalNet: 1057.93,
  totalYield: 72.41,
  estimated: false,
  byKind: [{ key: 'CDB', gross: 1072.41, percent: 100 }],
  byIndexer: [{ key: 'CDI_PERCENT', gross: 1072.41, percent: 100 }],
  byMaturity: [{ key: 'DAILY', gross: 1072.41, percent: 100 }],
  upcomingMaturities: [],
  accounts: [
    {
      accountId: 'inv-1',
      accountName: 'Investimentos',
      balance: 1500,
      allocatedPrincipal: 1000,
      unallocated: 500,
    },
  ],
}

const PENDING_APPLICATION: PendingInvestmentTransfer = {
  transferGroupId: 'tg-app',
  accountId: 'inv-1',
  accountName: 'Investimentos',
  counterpartAccountName: 'Conta corrente',
  date: '2026-10-20',
  amount: 2000,
  description: 'CDB Inter liquidez',
  direction: 'APPLICATION',
}

const PENDING_REDEMPTION: PendingInvestmentTransfer = {
  ...PENDING_APPLICATION,
  transferGroupId: 'tg-red',
  date: '2026-10-28',
  amount: 1061.1,
  description: 'Resgate CDB',
  direction: 'REDEMPTION',
}

const INDEXES: MarketIndexes = {
  indexes: [
    { index: 'CDI', date: '2026-10-29', value: 0.050788, stale: false },
    { index: 'SELIC', date: '2026-10-29', value: 0.050788, stale: false },
    { index: 'IPCA', date: '2026-09-01', value: 0.82, stale: false },
  ],
  treasuryBaseDate: '2026-10-29',
  treasuryStale: false,
}

function mockApi(
  options: {
    holdings?: FixedIncomeHolding[]
    summary?: InvestmentSummary
    indexes?: MarketIndexes
    pending?: PendingInvestmentTransfer[]
  } = {},
) {
  server.use(
    http.get('*/investments/pending-transfers', () => HttpResponse.json(options.pending ?? [])),
    http.get('*/investments/summary', () => HttpResponse.json(options.summary ?? SUMMARY)),
    http.get('*/investments/holdings', () => HttpResponse.json(options.holdings ?? [HOLDING])),
    http.get('*/investments/indexes/latest', () => HttpResponse.json(options.indexes ?? INDEXES)),
  )
}

afterEach(() => {
  cleanup()
})

describe('InvestmentsPage', () => {
  it('shows totals, the holding and the index date', async () => {
    mockApi()
    renderWithProviders(<InvestmentsPage />)

    await waitFor(() => expect(screen.getByText('CDB Inter')).toBeTruthy())
    expect(screen.getByText('Líquido se resgatar hoje')).toBeTruthy()
    expect(screen.getByText(/110% do CDI/)).toBeTruthy()
    expect(screen.getByText(/CDI de 29\/10\/2026/)).toBeTruthy()
  })

  it('offers to register the unallocated balance of an investment account', async () => {
    mockApi()
    renderWithProviders(<InvestmentsPage />)

    await waitFor(() => expect(screen.getByText(/sem aplicação registrada/)).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Registrar aplicação' })).toBeTruthy()
  })

  it('warns when an index is stale', async () => {
    mockApi({
      indexes: {
        ...INDEXES,
        indexes: INDEXES.indexes.map((i) => (i.index === 'CDI' ? { ...i, stale: true } : i)),
      },
    })
    renderWithProviders(<InvestmentsPage />)

    await waitFor(() => expect(screen.getByText(/CDI está desatualizado/)).toBeTruthy())
  })

  it('shows the empty state without holdings', async () => {
    mockApi({
      holdings: [],
      summary: {
        ...SUMMARY,
        totalPrincipal: 0,
        byKind: [],
        byIndexer: [],
        byMaturity: [],
        accounts: [],
      },
    })
    renderWithProviders(<InvestmentsPage />)

    await waitFor(() => expect(screen.getByText('Nenhuma aplicação ativa')).toBeTruthy())
  })

  it('opens the redemption dialog with the preview', async () => {
    mockApi()
    server.use(
      http.get('*/investments/holdings/h-1/redemption-preview', () =>
        HttpResponse.json({ ...HOLDING.valuation }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<InvestmentsPage />)

    await user.click(await screen.findByRole('button', { name: 'Ações de CDB Inter' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Resgatar' }))

    const preview = await screen.findByRole('region', { name: 'Prévia do resgate' })
    await waitFor(() => expect(preview.textContent).toContain('Líquido'))
  })
  it('registers an imported application linked to its transfer', async () => {
    let body: Record<string, unknown> | null = null
    mockApi({ pending: [PENDING_APPLICATION] })
    server.use(
      http.post('*/investments/holdings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(HOLDING, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<InvestmentsPage />)

    const panel = await screen.findByRole('region', { name: 'Movimentos para registrar' })
    expect(panel.textContent).toContain('CDB Inter liquidez')
    await user.click(within(panel).getByRole('button', { name: 'Registrar aplicação' }))

    expect(await screen.findByText(/Vinculada à transferência do extrato/)).toBeTruthy()
    expect((screen.getByLabelText('Data da aplicação') as HTMLInputElement).value).toBe(
      '2026-10-20',
    )
    await user.type(screen.getByPlaceholderText('ex: 110'), '105')
    await user.click(screen.getByRole('button', { name: 'Registrar aplicação' }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      accountId: 'inv-1',
      principal: '2000.00',
      appliedAt: '2026-10-20',
      fundingTransferGroupId: 'tg-app',
      fromAccountId: null,
    })
  })

  it('reconciles an imported redemption with the chosen holding', async () => {
    let body: Record<string, unknown> | null = null
    mockApi({ pending: [PENDING_REDEMPTION] })
    server.use(
      http.get('*/investments/holdings/h-1/redemption-preview', () =>
        HttpResponse.json({ ...HOLDING.valuation }),
      ),
      http.post('*/investments/holdings/h-1/redemptions', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...HOLDING, status: 'REDEEMED' })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<InvestmentsPage />)

    await user.click(await screen.findByRole('button', { name: 'Conciliar resgate' }))
    await user.click(await screen.findByRole('button', { name: /CDB Inter/ }))

    expect(await screen.findByText(/Vinculado à transferência do extrato/)).toBeTruthy()
    expect(screen.queryByLabelText('Conta de destino')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Registrar resgate' }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      date: '2026-10-28',
      total: true,
      transferGroupId: 'tg-red',
      toAccountId: null,
      netAmount: null,
    })
  })

  it('says when there is no holding to reconcile a redemption with', async () => {
    mockApi({ pending: [PENDING_REDEMPTION], holdings: [] })
    const user = userEvent.setup()
    renderWithProviders(<InvestmentsPage />)

    await user.click(await screen.findByRole('button', { name: 'Conciliar resgate' }))
    expect(await screen.findByText(/Nenhuma aplicação ativa em/)).toBeTruthy()
  })
})

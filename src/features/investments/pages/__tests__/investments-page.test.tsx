import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import type {
  FixedIncomeHolding,
  InvestmentSummary,
  MarketIndexes,
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
  } = {},
) {
  server.use(
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
})

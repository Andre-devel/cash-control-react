import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import BankSyncPage from '../bank-sync-page'
import type { BankSyncOverview, BankSyncRun } from '@/features/bank-sync/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const OVERVIEW: BankSyncOverview = {
  nextScheduledAt: '2026-11-04T18:13:00Z',
  retentionDays: 30,
  connections: [
    {
      connectionId: 'c-pf',
      connectorName: 'Inter PF',
      itemId: 'item-pf',
      status: 'UPDATED',
      statusDetail: null,
      lastSyncedAt: '2026-11-04T15:58:00Z',
      accounts: [
        {
          id: 'a1',
          kind: 'BANK',
          name: 'BANCO INTER',
          number: '32323671-5',
          accountId: null,
          creditCardId: null,
        },
        {
          id: 'a2',
          kind: 'CREDIT',
          name: 'GOLD',
          number: '7866',
          accountId: null,
          creditCardId: null,
        },
      ],
      lastRunAt: '2026-11-04T17:13:00Z',
      lastRunOutcome: 'NO_CHANGE',
      lastSuccessAt: '2026-11-04T17:13:00Z',
      lastProblemAt: null,
      lastProblemMessage: null,
      runsLast24h: 24,
      problemsLast24h: 0,
      transactionsQueuedLast24h: 3,
    },
    {
      connectionId: 'c-pj',
      connectorName: 'Inter Empresas',
      itemId: 'item-pj',
      status: 'LOGIN_ERROR',
      statusDetail: 'Credenciais inválidas',
      lastSyncedAt: null,
      accounts: [],
      lastRunAt: '2026-11-04T17:13:00Z',
      lastRunOutcome: 'ERROR',
      lastSuccessAt: null,
      lastProblemAt: '2026-11-04T17:13:00Z',
      lastProblemMessage: 'Credenciais inválidas',
      runsLast24h: 24,
      problemsLast24h: 22,
      transactionsQueuedLast24h: 0,
    },
  ],
}

function run(overrides: Partial<BankSyncRun>): BankSyncRun {
  return {
    id: 'r1',
    connectionId: 'c-pf',
    itemId: 'item-pf-0000',
    connectorName: 'Inter PF',
    trigger: 'SCHEDULED',
    webhookEvent: null,
    outcome: 'NO_CHANGE',
    startedAt: '2026-11-04T17:13:00.000Z',
    finishedAt: '2026-11-04T17:13:01.100Z',
    itemStatus: 'UPDATED',
    itemLastUpdatedAt: '2026-11-04T15:58:00Z',
    accountsRead: 2,
    transactionsQueued: null,
    investmentsCreated: 0,
    investmentsRedeemed: 0,
    investmentsFailed: 0,
    webhookDelayMinutes: null,
    errorMessage: null,
    ...overrides,
  }
}

const RUNS = [
  run({
    id: 'r-err',
    connectionId: 'c-pj',
    connectorName: 'Inter Empresas',
    outcome: 'ERROR',
    itemStatus: 'LOGIN_ERROR',
    accountsRead: null,
    errorMessage: 'Credenciais inválidas',
  }),
  run({ id: 'r-ok' }),
]

let lastRunsUrl: URL | null = null

beforeEach(() => {
  lastRunsUrl = null
  server.use(
    http.get('*/admin/bank-sync/overview', () => HttpResponse.json(OVERVIEW)),
    http.get('*/admin/bank-sync/runs', ({ request }) => {
      lastRunsUrl = new URL(request.url)
      return HttpResponse.json({
        content: RUNS,
        page: 0,
        size: 25,
        totalElements: 2,
        totalPages: 1,
      })
    }),
  )
})

describe('BankSyncPage', () => {
  it('shows the health of each connection', async () => {
    renderWithProviders(<BankSyncPage />)

    const pj = await screen.findByRole('region', { name: 'Inter Empresas' })
    expect(pj).toHaveTextContent('Precisa reconectar')
    expect(pj).toHaveTextContent('22 com problema')
    expect(pj).toHaveTextContent('Credenciais inválidas')
    const pf = screen.getByRole('region', { name: 'Inter PF' })
    expect(pf).toHaveTextContent('nenhum problema')
    expect(pf).toHaveTextContent('3 lançamentos')
    expect(pf).toHaveTextContent('BANCO INTER ••71-5 · GOLD ••7866')
    expect(screen.getByText(/guardada por 30 dias/)).toBeInTheDocument()
  })

  it('lists runs and expands one to show the error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BankSyncPage />)

    const list = await screen.findByRole('list', { name: 'Execuções' })
    expect(list).toHaveTextContent('2 contas lidas')
    const errorRow = screen
      .getAllByRole('button', { expanded: false })
      .find(
        (b) => b.textContent?.includes('Inter Empresas') && b.textContent.includes('Varredura'),
      )!
    await user.click(errorRow)

    expect(errorRow).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('LOGIN_ERROR')).toBeInTheDocument()
  })

  it('filters by outcome and by connection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BankSyncPage />)
    await screen.findByRole('list', { name: 'Execuções' })

    await user.click(screen.getByRole('button', { name: 'Com problema' }))
    await waitFor(() => expect(lastRunsUrl?.searchParams.get('outcome')).toBe('ERROR,PARTIAL'))
    expect(screen.getByRole('button', { name: 'Com problema' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.selectOptions(screen.getByLabelText('Conexão'), 'c-pj')
    await waitFor(() => expect(lastRunsUrl?.searchParams.get('connectionId')).toBe('c-pj'))
  })

  it('syncs a connection now and reloads the log', async () => {
    const user = userEvent.setup()
    let refreshed = ''
    server.use(
      http.post('*/bank-connections/:id/refresh', ({ params }) => {
        refreshed = String(params.id)
        return HttpResponse.json({})
      }),
    )
    renderWithProviders(<BankSyncPage />)

    const pf = await screen.findByRole('region', { name: 'Inter PF' })
    lastRunsUrl = null
    await user.click(
      Array.from(pf.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Sincronizar agora'),
      )!,
    )

    await waitFor(() => expect(refreshed).toBe('c-pf'))
    // O histórico é pedido de novo depois da leitura.
    await waitFor(() => expect(lastRunsUrl).not.toBeNull())
  })

  it('says when no bank is connected', async () => {
    server.use(
      http.get('*/admin/bank-sync/overview', () =>
        HttpResponse.json({ ...OVERVIEW, connections: [] }),
      ),
      http.get('*/admin/bank-sync/runs', () =>
        HttpResponse.json({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 }),
      ),
    )
    renderWithProviders(<BankSyncPage />)

    expect(await screen.findByText('Nenhum banco conectado.')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma execução encontrada.')).toBeInTheDocument()
  })
})

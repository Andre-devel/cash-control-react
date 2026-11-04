import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_GOALS } from '@/test/handlers/dashboard.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import type { Account } from '@/features/accounts/types'
import type { FixedIncomeHolding } from '@/features/investments/types'
import type { SavingsGoal } from '@/features/goals/types'
import GoalsPage from '../goals-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Nubank',
    type: 'CHECKING',
    balance: '5000.00',
    currencyCode: 'BRL',
    sortOrder: 0,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const HOLDINGS = [
  { id: 'h-1', accountId: 'inv-1', accountName: 'Inter Invest', name: 'CDB Banco X' },
] as FixedIncomeHolding[]

interface Request {
  method: string
  url: URL
  body: unknown
}

let requests: Request[] = []
const writes = () => requests.filter((r) => r.method !== 'GET')

function serve(goals: SavingsGoal[]) {
  server.use(
    http.get('*/goals', ({ request }) => {
      requests.push({ method: 'GET', url: new URL(request.url), body: null })
      return HttpResponse.json(goals)
    }),
    http.post('*/goals', async ({ request }) => {
      const body = await request.json()
      requests.push({ method: 'POST', url: new URL(request.url), body })
      return HttpResponse.json({ ...MOCK_GOALS[0], id: 'new' }, { status: 201 })
    }),
    http.put('*/goals/:id', async ({ request }) => {
      const body = await request.json()
      requests.push({ method: 'PUT', url: new URL(request.url), body })
      return HttpResponse.json(MOCK_GOALS[0])
    }),
    http.delete('*/goals/:id', ({ request }) => {
      requests.push({ method: 'DELETE', url: new URL(request.url), body: null })
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('*/goals/:id/unarchive', ({ request }) => {
      requests.push({ method: 'POST', url: new URL(request.url), body: null })
      return HttpResponse.json(MOCK_GOALS[0])
    }),
    http.get('*/accounts', () => HttpResponse.json(ACCOUNTS)),
    http.get('*/investments/holdings', () => HttpResponse.json(HOLDINGS)),
  )
}

beforeEach(() => {
  requests = []
  useHideValuesStore.setState({ hidden: false })
  serve(MOCK_GOALS)
})

afterEach(() => {
  cleanup()
})

describe('GoalsPage', () => {
  it('lists active goals with progress, remaining amount and monthly plan', async () => {
    renderWithProviders(<GoalsPage />)

    const card = await screen.findByRole('article', { name: 'Reserva de emergência' })
    expect(requests[0].url.searchParams.get('includeArchived')).toBe('true')
    expect(card.textContent).toContain('25%')
    expect(card.textContent).toMatch(/Faltam R\$\s?15\.000,00/)
    expect(card.textContent).toMatch(/Guardar R\$\s?1\.250,00 por mês até 12\/2027/)
    await waitFor(() => expect(card.textContent).toContain('Conta Nubank'))
    expect(
      within(card).getByRole('progressbar', { name: 'Progresso de Reserva de emergência' }),
    ).toBeTruthy()

    const reached = screen.getByRole('article', { name: 'Viagem' })
    expect(reached.textContent).toContain('Meta atingida')
    await waitFor(() => expect(reached.textContent).toContain('Aplicação CDB Banco X'))
  })

  it('shows the empty state without goals', async () => {
    serve([])
    renderWithProviders(<GoalsPage />)

    expect(await screen.findByText('Nenhuma meta ainda')).toBeTruthy()
  })

  it('creating sends the right body', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GoalsPage />)
    await screen.findByRole('article', { name: 'Reserva de emergência' })

    await user.click(screen.getByRole('button', { name: 'Nova meta' }))
    await user.type(await screen.findByLabelText('Nome'), 'Notebook novo')
    await user.type(screen.getByLabelText('Valor da meta'), '6.500,50')
    await user.type(screen.getByLabelText('Prazo (opcional)'), '2027-06-30')
    const link = screen.getByLabelText('Acompanhar pelo saldo de (opcional)')
    await waitFor(() =>
      expect(within(link).getByRole('option', { name: 'CDB Banco X · Inter Invest' })).toBeTruthy(),
    )
    await user.selectOptions(link, 'holding:h-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].method).toBe('POST')
    expect(writes()[0].body).toEqual({
      name: 'Notebook novo',
      targetAmount: '6500.50',
      targetDate: '2027-06-30',
      accountId: null,
      holdingId: 'h-1',
      icon: 'savings',
      color: '#5CE1B8',
    })
  })

  it('rejects a zero target with a pt-BR message before calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GoalsPage />)
    await screen.findByRole('article', { name: 'Reserva de emergência' })

    await user.click(screen.getByRole('button', { name: 'Nova meta' }))
    await user.type(await screen.findByLabelText('Nome'), 'Reserva')
    await user.type(screen.getByLabelText('Valor da meta'), '0')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Valor deve ser maior que zero')).toBeTruthy()
    expect(writes()).toHaveLength(0)
  })

  it('editing keeps the account link and sends a PUT without date when cleared', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GoalsPage />)
    await screen.findByRole('article', { name: 'Reserva de emergência' })

    await user.click(screen.getByRole('button', { name: 'Editar Reserva de emergência' }))
    const amount = await screen.findByLabelText('Valor da meta')
    expect((amount as HTMLInputElement).value).toBe('20.000,00')
    await user.clear(screen.getByLabelText('Prazo (opcional)'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].method).toBe('PUT')
    expect(writes()[0].url.pathname).toMatch(/\/goals\/goal-1$/)
    expect(writes()[0].body).toMatchObject({
      accountId: 'acc-1',
      holdingId: null,
      targetDate: null,
    })
  })

  it('archives a goal with progress through DELETE', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GoalsPage />)
    await screen.findByRole('article', { name: 'Reserva de emergência' })

    await user.click(screen.getByRole('button', { name: 'Editar Reserva de emergência' }))
    await user.click(await screen.findByRole('button', { name: 'Arquivar meta' }))

    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].method).toBe('DELETE')
    expect(writes()[0].url.pathname).toMatch(/\/goals\/goal-1$/)
  })

  it('lists archived goals on demand and reactivates them', async () => {
    const user = userEvent.setup()
    serve([
      ...MOCK_GOALS,
      { ...MOCK_GOALS[0], id: 'goal-old', name: 'Antiga', archivedAt: '2026-10-01T00:00:00Z' },
    ])
    renderWithProviders(<GoalsPage />)
    await screen.findByRole('article', { name: 'Reserva de emergência' })
    expect(screen.queryByRole('article', { name: 'Antiga' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Ver arquivadas (1)' }))
    const archived = screen.getByRole('article', { name: 'Antiga' })
    await user.click(within(archived).getByRole('button', { name: 'Reativar' }))

    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].url.pathname).toMatch(/\/goals\/goal-old\/unarchive$/)
  })
})

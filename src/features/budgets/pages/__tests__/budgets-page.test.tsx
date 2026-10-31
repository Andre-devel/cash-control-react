import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_BUDGET_PROGRESS } from '@/test/handlers/dashboard.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import type { BudgetProgress } from '@/features/budgets/types'
import type { Category } from '@/features/categories/types'
import BudgetsPage from '../budgets-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

function category(id: string, name: string, parentId: string | null = null): Category {
  return {
    id,
    name,
    color: '#22c55e',
    icon: 'tag',
    parentId,
    sortOrder: 0,
    isDefault: false,
    isHidden: false,
    isArchived: false,
  }
}

const CATEGORIES: Category[] = [
  {
    ...category('cat-home', 'Casa'),
    subcategories: [
      category('cat-food', 'Mercado', 'cat-home'),
      category('cat-gas', 'Gás', 'cat-home'),
    ],
  },
  category('cat-rest', 'Restaurantes'),
  category('cat-fun', 'Lazer'),
]

interface Request {
  method: string
  url: URL
  body: unknown
}

let requests: Request[] = []

function serve(progress: BudgetProgress) {
  server.use(
    http.get('*/budgets', ({ request }) => {
      requests.push({ method: 'GET', url: new URL(request.url), body: null })
      return HttpResponse.json(progress)
    }),
    http.put('*/budgets/:id', async ({ request }) => {
      requests.push({ method: 'PUT', url: new URL(request.url), body: await request.json() })
      return HttpResponse.json({})
    }),
    http.delete('*/budgets/:id', ({ request }) => {
      requests.push({ method: 'DELETE', url: new URL(request.url), body: null })
      return new HttpResponse(null, { status: 204 })
    }),
    http.get('*/categories', () => HttpResponse.json(CATEGORIES)),
  )
}

const writes = () => requests.filter((r) => r.method !== 'GET')

beforeEach(() => {
  requests = []
  useHideValuesStore.setState({ hidden: false })
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15))
  serve(MOCK_BUDGET_PROGRESS)
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('BudgetsPage', () => {
  it('shows totals, each category with its parent, the month adjustment and the forecast', async () => {
    renderWithProviders(<BudgetsPage />)

    await waitFor(() => expect(screen.getByText('Restaurantes')).toBeTruthy())
    expect(requests[0].url.searchParams.get('month')).toBe('2026-10')
    expect(screen.getByText('Casa ›')).toBeTruthy()
    expect(screen.getByText('113%')).toBeTruthy()
    expect(screen.getByText('só neste mês')).toBeTruthy()
    expect(screen.getByText(/Passou/)).toBeTruthy()
    expect(screen.getByText(/gastos sem categoria/)).toBeTruthy()
    expect(screen.getAllByTestId('budget-pace').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('budget-forecast').length).toBeGreaterThan(0)
  })

  it('changes the month through the stepper', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetsPage />)
    await waitFor(() => expect(screen.getByText('Restaurantes')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }))

    await waitFor(() =>
      expect(requests.some((r) => r.url.searchParams.get('month') === '2026-11')).toBe(true),
    )
  })

  it('creates a default cap, offering only categories without one', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetsPage />)
    await waitFor(() => expect(screen.getByText('Restaurantes')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Novo orçamento' }))
    const select = await screen.findByLabelText('Categoria')
    const offered = within(select)
      .getAllByRole('option')
      .map((o) => o.getAttribute('value'))
    expect(offered).toEqual(['', 'cat-home', 'cat-gas', 'cat-fun'])

    await user.selectOptions(select, 'cat-fun')
    await user.type(screen.getByLabelText('Teto do mês'), '250,00')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].url.pathname).toMatch(/\/budgets\/cat-fun$/)
    expect(writes()[0].body).toEqual({ amount: '250.00', month: null })
  })

  it('turning a month adjustment into every month saves the default and clears the adjustment', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetsPage />)
    await waitFor(() => expect(screen.getByText('Restaurantes')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: /Restaurantes/ }))
    const amount = await screen.findByLabelText('Teto do mês')
    expect((amount as HTMLInputElement).value).toBe('400,00')
    expect((screen.getByLabelText(/Só em/) as HTMLInputElement).checked).toBe(true)

    await user.click(screen.getByLabelText('Todo mês'))
    await user.clear(amount)
    await user.type(amount, '450')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(writes()).toHaveLength(2))
    expect(writes()[0]).toMatchObject({ method: 'PUT', body: { amount: '450', month: null } })
    expect(writes()[1].method).toBe('DELETE')
    expect(writes()[1].url.searchParams.get('month')).toBe('2026-10')
  })

  it('removing a default cap deletes it without a month', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetsPage />)
    await waitFor(() => expect(screen.getByText('Restaurantes')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: /Mercado/ }))
    await user.click(await screen.findByRole('button', { name: 'Remover orçamento' }))

    await waitFor(() => expect(writes()).toHaveLength(1))
    expect(writes()[0].method).toBe('DELETE')
    expect(writes()[0].url.pathname).toMatch(/\/budgets\/cat-food$/)
    expect(writes()[0].url.searchParams.has('month')).toBe(false)
  })

  it('rejects a zero cap before calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetsPage />)
    await waitFor(() => expect(screen.getByText('Restaurantes')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Novo orçamento' }))
    await user.selectOptions(await screen.findByLabelText('Categoria'), 'cat-fun')
    await user.type(screen.getByLabelText('Teto do mês'), '0')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Valor deve ser maior que zero')).toBeTruthy()
    expect(writes()).toHaveLength(0)
  })

  it('shows the empty state when no category has a cap', async () => {
    serve({ ...MOCK_BUDGET_PROGRESS, items: [], totalBudget: 0, totalSpent: 0 })
    renderWithProviders(<BudgetsPage />)

    expect(await screen.findByText('Nenhum orçamento ainda')).toBeTruthy()
  })
})

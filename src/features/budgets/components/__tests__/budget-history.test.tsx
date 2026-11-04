import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type * as ReactRouterDom from 'react-router-dom'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { useHideValuesStore } from '@/lib/hide-values'
import type { BudgetHistoryData } from '@/features/budgets/types'
import { BudgetHistory } from '../budget-history'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouterDom>()),
  useNavigate: () => mockNavigate,
}))

/** Meses terminando em out/2026: `count` = 6 vai de mai a out. */
function monthsUntilOctober(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(2026, 9 - (count - 1 - i), 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

function history(count: number): BudgetHistoryData {
  const months = monthsUntilOctober(count)
  return {
    months,
    items: [
      {
        categoryId: 'cat-food',
        name: 'Mercado',
        icon: 'shopping-cart',
        color: '#22c55e',
        cells: months.map((month, i) => {
          // O último mês estoura; o penúltimo fica perto do teto; o primeiro não tinha teto.
          if (i === 0) return { month, budget: null, spent: 150, percent: null }
          if (i === count - 1) return { month, budget: 1000, spent: 1200, percent: 120 }
          if (i === count - 2) return { month, budget: 1000, spent: 900, percent: 90 }
          return { month, budget: 1000, spent: 500, percent: 50 }
        }),
      },
    ],
  }
}

let requested: string[] = []

beforeEach(() => {
  requested = []
  mockNavigate.mockReset()
  useHideValuesStore.setState({ hidden: false })
  server.use(
    http.get('*/budgets/history', ({ request }) => {
      const months = new URL(request.url).searchParams.get('months') ?? ''
      requested.push(months)
      return HttpResponse.json(history(Number(months)))
    }),
  )
})

const monthHeaders = () =>
  screen.getAllByRole('columnheader').filter((th) => th.textContent !== 'Categoria')

describe('BudgetHistory', () => {
  it('renderiza 6 meses por padrão', async () => {
    renderWithProviders(<BudgetHistory />)

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(requested).toEqual(['6'])
    expect(monthHeaders().map((th) => th.textContent)).toEqual([
      'mai/26',
      'jun/26',
      'jul/26',
      'ago/26',
      'set/26',
      'out/26',
    ])
    const row = screen.getByRole('row', { name: /Mercado/ })
    expect(within(row).getAllByRole('button')).toHaveLength(6)
    expect(screen.getByRole('tab', { name: '6 meses' })).toHaveAttribute('aria-selected', 'true')
  })

  it('trocar para 12 meses refaz a busca', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetHistory />)
    await screen.findByRole('table')

    await user.click(screen.getByRole('tab', { name: '12 meses' }))

    expect(await screen.findByRole('columnheader', { name: 'nov/25' })).toBeInTheDocument()
    expect(requested).toEqual(['6', '12'])
    expect(monthHeaders()).toHaveLength(12)
  })

  it('célula estourada traz o rótulo além da cor', async () => {
    renderWithProviders(<BudgetHistory />)

    const over = await screen.findByRole('button', { name: /Mercado, out\/26/ })
    expect(over).toHaveAttribute('data-tone', 'over')
    expect(over).toHaveTextContent('120% · Estourou')

    const warn = screen.getByRole('button', { name: /Mercado, set\/26/ })
    expect(warn).toHaveAttribute('data-tone', 'warn')
    expect(warn).toHaveTextContent('Perto do teto')

    expect(screen.getByRole('button', { name: /Mercado, mai\/26/ })).toHaveTextContent('Sem teto')
  })

  it('clique na célula abre os lançamentos da categoria naquele mês', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BudgetHistory />)

    await user.click(await screen.findByRole('button', { name: /Mercado, set\/26/ }))

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    const target = new URL(mockNavigate.mock.calls[0]?.[0] as string, 'http://localhost')
    expect(target.pathname).toBe('/transactions')
    expect(target.searchParams.get('categoryId')).toBe('cat-food')
    expect(target.searchParams.get('period')).toBe('2026-09')
    expect(target.searchParams.get('includeCreditCard')).toBe('true')
  })

  it('no celular mostra um cartão por categoria com os meses em fila', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: query === '(max-width: 767px)',
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )
    try {
      renderWithProviders(<BudgetHistory />)

      expect(await screen.findByText('Mercado')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /Mercado, / })).toHaveLength(6)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

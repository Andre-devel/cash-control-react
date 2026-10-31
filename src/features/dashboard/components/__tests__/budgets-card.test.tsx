import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_BUDGET_PROGRESS } from '@/test/handlers/dashboard.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import type { BudgetProgress } from '@/features/budgets/types'
import { BudgetsCard } from '../budgets-card'

let requestedMonths: string[] = []

function serve(progress: BudgetProgress) {
  server.use(
    http.get('*/budgets', ({ request }) => {
      requestedMonths.push(new URL(request.url).searchParams.get('month') ?? '')
      return HttpResponse.json(progress)
    }),
  )
}

beforeEach(() => {
  requestedMonths = []
  useHideValuesStore.setState({ hidden: false })
})

afterEach(() => {
  cleanup()
})

describe('BudgetsCard', () => {
  it('shows the categories closest to the cap for the chosen month, linking to the page', async () => {
    serve(MOCK_BUDGET_PROGRESS)
    renderWithProviders(<BudgetsCard month="2026-09" />)

    expect(await screen.findByText('Restaurantes')).toBeTruthy()
    expect(requestedMonths).toEqual(['2026-09'])
    expect(screen.getByText('113%')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver orçamentos' }).getAttribute('href')).toBe(
      '/budgets',
    )
    // Compacto: sem previsto nem selo de ajuste do mês.
    expect(screen.queryByText('só neste mês')).toBeNull()
    expect(screen.queryByTestId('budget-forecast')).toBeNull()
  })

  it('invites to create a budget when there is none', async () => {
    serve({ ...MOCK_BUDGET_PROGRESS, items: [] })
    renderWithProviders(<BudgetsCard month="2026-10" />)

    expect(await screen.findByRole('link', { name: 'Criar orçamento' })).toBeTruthy()
  })

  it('hides amounts when values are hidden', async () => {
    useHideValuesStore.setState({ hidden: true })
    serve(MOCK_BUDGET_PROGRESS)
    renderWithProviders(<BudgetsCard month="2026-10" />)

    await screen.findByText('Restaurantes')
    expect(screen.getAllByText('Valor oculto').length).toBeGreaterThan(0)
    expect(screen.queryByText(/452/)).toBeNull()
  })
})

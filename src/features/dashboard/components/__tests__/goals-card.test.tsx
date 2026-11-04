import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen, cleanup, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_GOALS } from '@/test/handlers/dashboard.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import type { SavingsGoal } from '@/features/goals/types'
import { GoalsCard } from '../goals-card'
import { MobileShortcuts } from '../mobile-shortcuts'

function goal(id: string, name: string, overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return { ...MOCK_GOALS[0], id, name, ...overrides }
}

function serve(goals: SavingsGoal[]) {
  server.use(http.get('*/goals', () => HttpResponse.json(goals)))
}

beforeEach(() => {
  useHideValuesStore.setState({ hidden: false })
})

afterEach(() => {
  cleanup()
})

describe('GoalsCard', () => {
  it('shows up to 3 active goals with their progress, linking to the goals page', async () => {
    serve([
      ...MOCK_GOALS,
      goal('goal-3', 'Carro'),
      goal('goal-4', 'Casa'),
      goal('goal-5', 'Arquivada', { archivedAt: '2026-11-03T12:00:00Z' }),
    ])
    renderWithProviders(<GoalsCard />)

    const card = await screen.findByRole('region', { name: 'Metas' })
    await within(card).findByText('Reserva de emergência')
    expect(within(card).getAllByRole('article')).toHaveLength(3)
    expect(within(card).getByText('Viagem')).toBeTruthy()
    expect(within(card).getByText('Carro')).toBeTruthy()
    expect(within(card).queryByText('Casa')).toBeNull()
    expect(within(card).queryByText('Arquivada')).toBeNull()
    expect(within(card).getByText('3 de 4 metas')).toBeTruthy()
    expect(card.textContent).toMatch(/Faltam R\$\s?15\.000,00/)
    expect(card.textContent).toMatch(/Guardar R\$\s?1\.250,00 por mês até 12\/2027/)
    expect(within(card).getByText('Meta atingida')).toBeTruthy()
    expect(within(card).queryByRole('button', { name: /Editar/ })).toBeNull()
    expect(within(card).getByRole('link', { name: 'Ver metas' }).getAttribute('href')).toBe(
      '/metas',
    )
  })

  it('invites to create a goal when there is none', async () => {
    serve([])
    renderWithProviders(<GoalsCard />)

    const link = await screen.findByRole('link', { name: /Criar meta/ })
    expect(link.getAttribute('href')).toBe('/metas')
  })

  it('shows an error with retry when the request fails', async () => {
    server.use(http.get('*/goals', () => new HttpResponse(null, { status: 500 })))
    renderWithProviders(<GoalsCard />)

    expect(await screen.findByText('Não foi possível carregar as metas.')).toBeTruthy()
  })
})

describe('MobileShortcuts', () => {
  it('links to goals showing the first goal progress', () => {
    renderWithProviders(<MobileShortcuts goals={MOCK_GOALS} />)

    const link = screen.getByRole('link', { name: /Metas/ })
    expect(link.getAttribute('href')).toBe('/metas')
    expect(link.textContent).toContain('Reserva de emergência')
    expect(link.textContent).toContain('25% · +1')
  })

  it('invites to create a goal without any', () => {
    renderWithProviders(<MobileShortcuts goals={[]} />)

    expect(screen.getByRole('link', { name: /Criar meta/ }).getAttribute('href')).toBe('/metas')
  })
})

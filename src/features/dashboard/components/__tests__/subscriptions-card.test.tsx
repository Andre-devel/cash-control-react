import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_SUBSCRIPTIONS } from '@/test/handlers/dashboard.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import type { Subscriptions } from '@/features/dashboard/types'
import { SubscriptionsCard } from '../subscriptions-card'

function serve(subscriptions: Subscriptions | null) {
  server.use(
    http.get('*/dashboard/subscriptions', () =>
      subscriptions
        ? HttpResponse.json(subscriptions)
        : HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
    ),
  )
}

beforeEach(() => {
  useHideValuesStore.setState({ hidden: false })
})

afterEach(() => {
  cleanup()
})

describe('SubscriptionsCard', () => {
  it('shows the monthly total and one row per subscription', async () => {
    serve(MOCK_SUBSCRIPTIONS)
    renderWithProviders(<SubscriptionsCard />)

    expect(await screen.findByText('Netflix')).toBeTruthy()
    expect(screen.getByText('Hostinger')).toBeTruthy()
    expect(screen.getByTestId('subscriptions-total').textContent).toBe('R$95,80/mês')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    // Só a sugestão leva o selo; a recorrência cadastrada não.
    expect(screen.getAllByText('detectada')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Ver recorrências' }).getAttribute('href')).toBe(
      '/recurrences',
    )
  })

  it('hides every amount when values are hidden', async () => {
    useHideValuesStore.setState({ hidden: true })
    serve(MOCK_SUBSCRIPTIONS)
    renderWithProviders(<SubscriptionsCard />)

    await screen.findByText('Netflix')
    // Total + dois itens.
    expect(screen.getAllByText('Valor oculto')).toHaveLength(3)
    expect(screen.queryByText(/95/)).toBeNull()
    expect(screen.queryByText(/55/)).toBeNull()
    expect(screen.queryByText(/39/)).toBeNull()
  })

  it('explains when there is no subscription', async () => {
    serve({ monthlyTotal: '0', items: [] })
    renderWithProviders(<SubscriptionsCard />)

    expect(await screen.findByText(/nenhuma assinatura mensal/i)).toBeTruthy()
    expect(screen.queryByTestId('subscriptions-total')).toBeNull()
  })

  it('offers a retry when loading fails', async () => {
    serve(null)
    renderWithProviders(<SubscriptionsCard />)

    expect(await screen.findByText('Não foi possível carregar as assinaturas.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
  })
})

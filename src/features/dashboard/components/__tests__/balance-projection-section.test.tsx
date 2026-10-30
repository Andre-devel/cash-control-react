import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_BALANCE_PROJECTION } from '@/test/handlers/dashboard.handlers'
import { useHideValuesStore } from '@/lib/hide-values'
import type { BalanceProjection } from '@/features/dashboard/types'
import { BalanceProjectionSection } from '../balance-projection-section'

let requestedDays: string[] = []

function serve(projection: BalanceProjection) {
  server.use(
    http.get('*/dashboard/projection', ({ request }) => {
      requestedDays.push(new URL(request.url).searchParams.get('days') ?? '')
      return HttpResponse.json(projection)
    }),
  )
}

beforeEach(() => {
  requestedDays = []
  useHideValuesStore.setState({ hidden: false })
  serve(MOCK_BALANCE_PROJECTION)
})

afterEach(() => {
  cleanup()
})

describe('BalanceProjectionSection', () => {
  it('asks for 30 days by default and shows today, end and lowest balance', async () => {
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() => expect(screen.getByText('Hoje')).toBeTruthy())
    expect(requestedDays).toEqual(['30'])
    expect(screen.getByText('Em 01 dez')).toBeTruthy()
    expect(screen.getByText('Menor · 01 nov')).toBeTruthy()
    expect(screen.queryByText(/fica negativo/)).toBeNull()
    expect(screen.getByText('Não inclui gastos ainda não lançados.')).toBeTruthy()
  })

  it('lists events and flags the estimated ones', async () => {
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() => expect(screen.getByText('Aluguel')).toBeTruthy())
    expect(screen.getByText('Salário')).toBeTruthy()
    expect(screen.getAllByText('estimado')).toHaveLength(1)
  })

  it('warns when the balance goes below zero', async () => {
    serve({
      ...MOCK_BALANCE_PROJECTION,
      lowest: { date: '2026-11-10', balance: '-300.00' },
      firstNegativeDate: '2026-11-10',
    })
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('10 nov'))
    expect(screen.getByRole('status').textContent).toContain('Saldo fica negativo')
  })

  it('refetches with the chosen horizon', async () => {
    renderWithProviders(<BalanceProjectionSection />)
    await waitFor(() => expect(screen.getByText('Hoje')).toBeTruthy())

    fireEvent.click(screen.getByRole('tab', { name: '90d' }))

    await waitFor(() => expect(requestedDays).toContain('90'))
    expect(screen.getByRole('tab', { name: '90d' }).getAttribute('aria-selected')).toBe('true')
  })

  it('shows only the first events until "Ver todos" is pressed', async () => {
    const events = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-11-${String(i + 2).padStart(2, '0')}`,
      kind: 'TRANSACTION' as const,
      description: `Conta ${i + 1}`,
      amount: '-10.00',
      estimated: false,
    }))
    serve({ ...MOCK_BALANCE_PROJECTION, events })
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() => expect(screen.getByText('Conta 5')).toBeTruthy())
    expect(screen.queryByText('Conta 6')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos (7)' }))

    expect(screen.getByText('Conta 7')).toBeTruthy()
  })

  it('says so when nothing is pending', async () => {
    serve({ ...MOCK_BALANCE_PROJECTION, events: [] })
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() =>
      expect(screen.getByText('Nada pendente nos próximos 30 dias.')).toBeTruthy(),
    )
  })

  it('hides the amounts when "Ocultar valores" is on', async () => {
    useHideValuesStore.setState({ hidden: true })
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() => expect(screen.getByText('Hoje')).toBeTruthy())
    expect(screen.queryByText('1.000')).toBeNull()
    expect(screen.getAllByText('Valor oculto').length).toBeGreaterThan(0)
  })

  it('shows an error with retry when the request fails', async () => {
    server.use(http.get('*/dashboard/projection', () => new HttpResponse(null, { status: 500 })))
    renderWithProviders(<BalanceProjectionSection />)

    await waitFor(() =>
      expect(screen.getByText('Falha ao carregar projeção de saldo.')).toBeTruthy(),
    )
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy()
  })
})

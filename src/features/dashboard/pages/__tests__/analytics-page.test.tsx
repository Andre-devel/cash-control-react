import { describe, it, expect, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { dashboardHandlers } from '@/test/handlers/dashboard.handlers'
import AnalyticsPage from '../analytics-page'

beforeEach(() => {
  server.use(...dashboardHandlers)
})

describe('AnalyticsPage', () => {
  it('mostra os gráficos do dashboard e volta para o início', async () => {
    renderWithProviders(<AnalyticsPage />)
    expect(screen.getByRole('heading', { name: 'Análises' })).toBeTruthy()
    await waitFor(() => expect(screen.getByText('Receitas vs Despesas')).toBeTruthy())
    expect(screen.getByText('Gastos por categoria')).toBeTruthy()
    expect(screen.getByText('Evolução do patrimônio')).toBeTruthy()
    expect(screen.getByText('Maiores despesas')).toBeTruthy()
    await waitFor(() => expect(screen.getByRole('region', { name: 'Assinaturas' })).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Voltar para o início' }).getAttribute('href')).toBe(
      '/dashboard',
    )
  })

  it('um período só vale para todos os gráficos', async () => {
    const seen: Record<string, string | null> = {}
    const track =
      (name: string) =>
      ({ request }: { request: Request }) => {
        seen[name] = new URL(request.url).searchParams.get('from')
        return HttpResponse.json(name === 'categories' ? { entries: [], totalAmount: '0' } : [])
      }
    server.use(
      http.get('*/dashboard/charts/categories', track('categories')),
      http.get('*/dashboard/widgets/largest-expenses', track('largest')),
    )
    renderWithProviders(<AnalyticsPage />)
    fireEvent.click(screen.getByRole('tab', { name: '12 meses' }))

    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const expected = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01`
    await waitFor(() => {
      expect(seen.categories).toBe(expected)
      expect(seen.largest).toBe(expected)
    })
    expect(screen.queryByText('Personalizar período')).toBeNull()
  })
})

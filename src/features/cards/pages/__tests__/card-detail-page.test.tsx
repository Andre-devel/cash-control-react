import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type * as ReactRouterDom from 'react-router-dom'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_CARD_1, MOCK_INVOICE, resetCardsStore } from '@/test/handlers/cards.handlers'
import CardDetailPage from '../card-detail-page'

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof ReactRouterDom>()),
  useParams: () => ({ id: MOCK_CARD_1.id }),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), action: vi.fn() },
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  resetCardsStore()
  server.use(
    http.get('*/cards/:id/invoices', () =>
      HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }),
    ),
  )
})

afterEach(() => {
  cleanup()
})

describe('CardDetailPage — lançamentos da fatura', () => {
  it('starts with the charges collapsed and shows them on "Ver lançamentos"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardDetailPage />)

    const toggle = await screen.findByRole('button', {
      name: `Ver lançamentos (${MOCK_INVOICE.items.length})`,
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(MOCK_INVOICE.items[0].description)).toBeNull()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Lançamentos da fatura' })).toBeInTheDocument()
    expect(screen.getByText(MOCK_INVOICE.items[0].description)).toBeInTheDocument()
    expect(screen.getByText(MOCK_INVOICE.items[1].description)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ocultar lançamentos' }))
    expect(screen.queryByText(MOCK_INVOICE.items[0].description)).toBeNull()
  })

  it('shows the card details only here', async () => {
    renderWithProviders(<CardDetailPage />)
    expect(await screen.findByRole('heading', { name: 'Detalhes do cartão' })).toBeInTheDocument()
    expect(screen.getByText('Limite total')).toBeInTheDocument()
  })
})

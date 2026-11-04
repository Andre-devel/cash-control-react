import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { useHideValuesStore } from '@/lib/hide-values'
import type { RecurrenceSuggestion } from '@/features/recurrences/types'
import {
  RecurrenceSuggestions,
  nextSuggestionDate,
  suggestionToFormValues,
} from '../recurrence-suggestions'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const HOSTINGER: RecurrenceSuggestion = {
  pattern: 'hostinger',
  description: 'Hostinger',
  amount: '39.90',
  dayOfMonth: 12,
  months: 4,
  lastDate: '2026-10-12',
  categoryId: null,
  accountId: 'account-1',
  creditCardId: null,
}

const SPOTIFY: RecurrenceSuggestion = {
  pattern: 'spotify',
  description: 'Spotify',
  amount: '21.90',
  dayOfMonth: 31,
  months: 3,
  lastDate: '2026-10-31',
  categoryId: null,
  accountId: null,
  creditCardId: 'card-1',
}

let suggestions: RecurrenceSuggestion[] = []
let dismissed: unknown[] = []

beforeEach(() => {
  suggestions = [HOSTINGER, SPOTIFY]
  dismissed = []
  useHideValuesStore.setState({ hidden: false })
  server.use(
    http.get('*/recurrences/suggestions', () => HttpResponse.json(suggestions)),
    http.post('*/recurrences/suggestions/dismiss', async ({ request }) => {
      const body = (await request.json()) as { pattern: string }
      dismissed.push(body)
      suggestions = suggestions.filter((s) => s.pattern !== body.pattern)
      return new HttpResponse(null, { status: 204 })
    }),
  )
})

afterEach(() => {
  cleanup()
})

describe('RecurrenceSuggestions', () => {
  it('renders one card per suggestion with amount, day and months', async () => {
    renderWithProviders(<RecurrenceSuggestions />)

    expect(await screen.findByRole('heading', { name: 'Parece recorrente' })).toBeTruthy()
    const card = screen.getByRole('listitem', { name: /Hostinger/ })
    expect(card.textContent).toContain('Hostinger · R$39,90 todo dia 12 · 4 meses')
    expect(within(card).getByRole('button', { name: 'Criar recorrência' })).toBeTruthy()
    expect(within(card).getByRole('button', { name: 'Ignorar' })).toBeTruthy()
    expect(screen.getByRole('listitem', { name: /Spotify/ })).toBeTruthy()
  })

  it('renders nothing when there is no suggestion', async () => {
    suggestions = []
    const { container } = renderWithProviders(<RecurrenceSuggestions />)

    await waitFor(() => expect(container.textContent).toBe(''))
    expect(screen.queryByText('Parece recorrente')).toBeNull()
  })

  it('hides amounts when values are hidden', async () => {
    useHideValuesStore.setState({ hidden: true })
    renderWithProviders(<RecurrenceSuggestions />)

    const card = await screen.findByRole('listitem', { name: /Hostinger/ })
    expect(within(card).getByText('Valor oculto')).toBeTruthy()
    expect(card.textContent).not.toContain('39,90')
  })

  it('dismiss sends the pattern and removes the card', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecurrenceSuggestions />)

    const card = await screen.findByRole('listitem', { name: /Hostinger/ })
    await user.click(within(card).getByRole('button', { name: 'Ignorar' }))

    await waitFor(() => expect(screen.queryByRole('listitem', { name: /Hostinger/ })).toBeNull())
    expect(dismissed).toEqual([{ pattern: 'hostinger' }])
    expect(screen.getByRole('listitem', { name: /Spotify/ })).toBeTruthy()
  })

  it('section disappears after dismissing the last suggestion', async () => {
    suggestions = [HOSTINGER]
    const user = userEvent.setup()
    renderWithProviders(<RecurrenceSuggestions />)

    await user.click(await screen.findByRole('button', { name: 'Ignorar' }))

    await waitFor(() => expect(screen.queryByText('Parece recorrente')).toBeNull())
  })

  it('create opens the recurrence dialog filled with the suggestion', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecurrenceSuggestions />)

    const card = await screen.findByRole('listitem', { name: /Hostinger/ })
    await user.click(within(card).getByRole('button', { name: 'Criar recorrência' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: /nova regra de recorrência/i })).toBeTruthy()
    expect(
      (within(dialog).getByRole('textbox', { name: /descrição/i }) as HTMLInputElement).value,
    ).toBe('Hostinger')
    expect((within(dialog).getByLabelText('Valor') as HTMLInputElement).value).toBe('39,90')
    expect((within(dialog).getByLabelText('Tipo') as HTMLSelectElement).value).toBe('EXPENSE')
    expect((within(dialog).getByLabelText('Frequência') as HTMLSelectElement).value).toBe('MONTHLY')
    expect((within(dialog).getByLabelText('Data de início') as HTMLInputElement).value).toBe(
      '2026-11-12',
    )
    await waitFor(() =>
      expect((within(dialog).getByLabelText('Conta') as HTMLSelectElement).value).toBe('account-1'),
    )

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('listitem', { name: /Hostinger/ })).toBeTruthy()
  })
})

describe('suggestionToFormValues', () => {
  it('maps a card suggestion to a credit card monthly expense', () => {
    expect(suggestionToFormValues(SPOTIFY)).toEqual({
      description: 'Spotify',
      amount: '21,90',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      accountId: '',
      categoryId: '',
      startDate: '2026-11-30',
      paymentMethod: 'CREDIT_CARD',
      creditCardId: 'card-1',
    })
  })

  it('starts on the same day of the next month, across the year', () => {
    expect(nextSuggestionDate({ ...HOSTINGER, lastDate: '2026-12-12' })).toBe('2027-01-12')
  })
})

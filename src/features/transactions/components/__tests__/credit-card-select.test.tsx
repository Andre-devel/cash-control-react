import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Card } from '@/features/cards/types'
import { CreditCardSelect } from '../credit-card-select'

const MOCK_CARDS: Card[] = [
  {
    id: 'card-1',
    name: 'Nubank',
    brand: 'VISA',
    creditLimit: '5000.00',
    closingDay: 1,
    dueDay: 10,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'card-2',
    name: 'Itaú',
    brand: 'MASTERCARD',
    creditLimit: '10000.00',
    closingDay: 15,
    dueDay: 25,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

beforeEach(() => {
  cleanup()
})

describe('CreditCardSelect', () => {
  it('renders a single disabled option when the cards list is empty', () => {
    const onChange = vi.fn()
    render(<CreditCardSelect value="" onChange={onChange} cards={[]} aria-label="Cartão" />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0].textContent).toMatch(/nenhum cartão cadastrado/i)
    expect(options[0]).toBeDisabled()
  })

  it('renders an empty default option plus one option per card', () => {
    const onChange = vi.fn()
    render(<CreditCardSelect value="" onChange={onChange} cards={MOCK_CARDS} aria-label="Cartão" />)
    const options = screen.getAllByRole('option')
    // empty option + 2 cards
    expect(options).toHaveLength(MOCK_CARDS.length + 1)
  })

  it('displays card name and brand for each card option', () => {
    const onChange = vi.fn()
    render(<CreditCardSelect value="" onChange={onChange} cards={MOCK_CARDS} aria-label="Cartão" />)
    expect(screen.getByRole('option', { name: /nubank \(visa\)/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /itaú \(mastercard\)/i })).toBeTruthy()
  })

  it('each card option has the card id as its value', () => {
    const onChange = vi.fn()
    render(<CreditCardSelect value="" onChange={onChange} cards={MOCK_CARDS} aria-label="Cartão" />)
    const nubank = screen.getByRole('option', { name: /nubank/i }) as HTMLOptionElement
    expect(nubank.value).toBe('card-1')
    const itau = screen.getByRole('option', { name: /itaú/i }) as HTMLOptionElement
    expect(itau.value).toBe('card-2')
  })

  it('calls onChange with the card id when the user picks a card', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CreditCardSelect value="" onChange={onChange} cards={MOCK_CARDS} aria-label="Cartão" />)
    await user.selectOptions(screen.getByRole('combobox', { name: /cartão/i }), 'card-1')
    expect(onChange).toHaveBeenCalledWith('card-1')
  })

  it('reflects the current value via the select element', () => {
    const onChange = vi.fn()
    render(
      <CreditCardSelect
        value="card-2"
        onChange={onChange}
        cards={MOCK_CARDS}
        aria-label="Cartão"
      />,
    )
    const select = screen.getByRole('combobox', { name: /cartão/i }) as HTMLSelectElement
    expect(select.value).toBe('card-2')
  })
})

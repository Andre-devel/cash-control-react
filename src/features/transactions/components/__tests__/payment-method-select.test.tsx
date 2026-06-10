import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { MOCK_PAYMENT_METHODS } from '@/test/handlers/payment-methods.handlers'
import { PaymentMethodSelect } from '../payment-method-select'

beforeEach(() => {
  cleanup()
})

describe('PaymentMethodSelect', () => {
  it('renders a disabled select while payment methods are loading', () => {
    const onChange = vi.fn()
    renderWithProviders(<PaymentMethodSelect value="" onChange={onChange} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('renders all seven payment method options after loading', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <PaymentMethodSelect value="" onChange={onChange} aria-label="Forma de pagamento" />,
    )

    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /forma de pagamento/i })
      expect(select).not.toBeDisabled()
    })

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(MOCK_PAYMENT_METHODS.length)
  })

  it('renders one option per payment method with correct label', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <PaymentMethodSelect value="" onChange={onChange} aria-label="Forma de pagamento" />,
    )

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /forma de pagamento/i })).not.toBeDisabled(),
    )

    for (const pm of MOCK_PAYMENT_METHODS) {
      expect(screen.getByRole('option', { name: pm.name })).toBeTruthy()
    }
  })

  it('each option has the slug as its value', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <PaymentMethodSelect value="" onChange={onChange} aria-label="Forma de pagamento" />,
    )

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /forma de pagamento/i })).not.toBeDisabled(),
    )

    for (const pm of MOCK_PAYMENT_METHODS) {
      const option = screen.getByRole('option', { name: pm.name }) as HTMLOptionElement
      expect(option.value).toBe(pm.slug)
    }
  })

  it('calls onChange with the selected slug when the user picks an option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderWithProviders(
      <PaymentMethodSelect value="" onChange={onChange} aria-label="Forma de pagamento" />,
    )

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /forma de pagamento/i })).not.toBeDisabled(),
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /forma de pagamento/i }), 'PIX')
    expect(onChange).toHaveBeenCalledWith('PIX')
  })

  it('reflects the current value via the select element', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <PaymentMethodSelect value="CASH" onChange={onChange} aria-label="Forma de pagamento" />,
    )

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /forma de pagamento/i })).not.toBeDisabled(),
    )

    const select = screen.getByRole('combobox', {
      name: /forma de pagamento/i,
    }) as HTMLSelectElement
    expect(select.value).toBe('CASH')
  })
})

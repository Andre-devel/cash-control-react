import { describe, it, expect } from 'vitest'
import { canPayInvoice, orderInvoices } from '@/features/invoices/utils/invoice-status'
import type { Invoice } from '@/features/cards/types'

const TODAY = new Date(2026, 2, 16) // 16/03/2026, horário local

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    creditCardId: 'card-1',
    referenceMonth: '2026-03',
    closingDate: '2026-03-15',
    dueDate: '2026-03-25',
    totalAmount: '100.00',
    paidAmount: '0.00',
    status: 'OPEN',
    paidWithoutTransaction: false,
    items: [],
    ...overrides,
  }
}

describe('canPayInvoice', () => {
  it('aceita ABERTA cujo fechamento já passou (job noturno ainda não rodou)', () => {
    expect(canPayInvoice(invoice({}), TODAY)).toBe(true)
  })

  it('recusa ABERTA que fecha hoje ou depois', () => {
    expect(canPayInvoice(invoice({ closingDate: '2026-03-16' }), TODAY)).toBe(false)
  })

  it.each(['CLOSED', 'OVERDUE', 'PARTIAL'] as const)('aceita %s com saldo', (status) => {
    expect(canPayInvoice(invoice({ status, closingDate: '2026-04-01' }), TODAY)).toBe(true)
  })

  it('recusa paga ou sem saldo', () => {
    expect(canPayInvoice(invoice({ status: 'PAID' }), TODAY)).toBe(false)
    expect(canPayInvoice(invoice({ paidAmount: '100.00', status: 'CLOSED' }), TODAY)).toBe(false)
  })
})

describe('orderInvoices', () => {
  it('puts the next invoice to close first, then closed ones, then future months', () => {
    const at = (id: string, closingDate: string) => invoice({ id, closingDate })
    const ordered = orderInvoices(
      [
        at('mai', '2027-04-30'),
        at('jan', '2026-12-30'),
        at('dez', '2026-11-30'),
        at('nov', '2026-10-30'),
        at('out', '2026-09-30'),
      ],
      '2026-11-03',
    )
    expect(ordered.map((i) => i.id)).toEqual(['dez', 'nov', 'out', 'jan', 'mai'])
  })
})

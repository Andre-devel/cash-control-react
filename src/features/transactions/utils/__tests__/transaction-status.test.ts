import { describe, it, expect } from 'vitest'
import {
  canPayTransaction,
  isLockedTransaction,
  isPayableStatus,
} from '@/features/transactions/utils/transaction-status'
import type { PaymentMethod } from '@/features/transactions/types'

const method = (slug: PaymentMethod['slug']): PaymentMethod => ({ id: slug, slug, name: slug })

describe('isPayableStatus', () => {
  it.each(['PENDING', 'OVERDUE'] as const)('aceita pagamento em %s', (status) => {
    expect(isPayableStatus(status)).toBe(true)
  })

  it.each(['PAID', 'CANCELLED'] as const)('recusa pagamento em %s', (status) => {
    expect(isPayableStatus(status)).toBe(false)
  })
})

describe('canPayTransaction', () => {
  it('permite pagar despesa pendente fora do cartão', () => {
    expect(canPayTransaction({ status: 'PENDING', paymentMethod: method('PIX') })).toBe(true)
  })

  it('não permite pagar compra no cartão, que é quitada pela fatura', () => {
    expect(canPayTransaction({ status: 'PENDING', paymentMethod: method('CREDIT_CARD') })).toBe(
      false,
    )
  })
})

describe('isLockedTransaction', () => {
  it('trava só o pagamento de fatura', () => {
    expect(isLockedTransaction({ type: 'INVOICE_PAYMENT' })).toBe(true)
    expect(isLockedTransaction({ type: 'EXPENSE' })).toBe(false)
  })
})

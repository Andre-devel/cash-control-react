import { describe, it, expect } from 'vitest'
import { isPayableStatus } from '@/features/transactions/utils/transaction-status'

describe('isPayableStatus', () => {
  it.each(['PENDING', 'OVERDUE'] as const)('aceita pagamento em %s', (status) => {
    expect(isPayableStatus(status)).toBe(true)
  })

  it.each(['PAID', 'CANCELLED'] as const)('recusa pagamento em %s', (status) => {
    expect(isPayableStatus(status)).toBe(false)
  })
})

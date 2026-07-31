import { describe, it, expect } from 'vitest'
import {
  TRANSACTION_TYPE_DISPLAY,
  isPositiveTransaction,
  transactionTypeBadgeKind,
  transactionTypeColor,
} from '../transaction-type'
import type { TransactionType } from '@/features/transactions/types'

const ALL_TYPES: TransactionType[] = [
  'INCOME',
  'EXPENSE',
  'REFUND',
  'TRANSFER',
  'MANUAL_ADJUSTMENT',
]

describe('TRANSACTION_TYPE_DISPLAY', () => {
  it('covers every type the backend can return', () => {
    for (const type of ALL_TYPES) {
      expect(TRANSACTION_TYPE_DISPLAY[type]).toBeDefined()
      expect(TRANSACTION_TYPE_DISPLAY[type].label).toBeTruthy()
    }
  })

  it('labels MANUAL_ADJUSTMENT as "Ajuste"', () => {
    expect(TRANSACTION_TYPE_DISPLAY.MANUAL_ADJUSTMENT.label).toBe('Ajuste')
  })
})

describe('isPositiveTransaction', () => {
  it('treats INCOME and REFUND as positive regardless of amount', () => {
    expect(isPositiveTransaction('INCOME', 100)).toBe(true)
    expect(isPositiveTransaction('REFUND', 100)).toBe(true)
  })

  it('treats EXPENSE as negative', () => {
    expect(isPositiveTransaction('EXPENSE', 100)).toBe(false)
  })

  it('decides MANUAL_ADJUSTMENT by the sign of the amount', () => {
    expect(isPositiveTransaction('MANUAL_ADJUSTMENT', 12800.5)).toBe(true)
    expect(isPositiveTransaction('MANUAL_ADJUSTMENT', -500)).toBe(false)
  })
})

describe('transactionTypeColor', () => {
  it('uses the fixed colour of types that have one', () => {
    expect(transactionTypeColor('EXPENSE', 100)).toBe('var(--expense)')
    expect(transactionTypeColor('INCOME', 100)).toBe('var(--income)')
  })

  it('derives the MANUAL_ADJUSTMENT colour from the sign', () => {
    expect(transactionTypeColor('MANUAL_ADJUSTMENT', 12800.5)).toBe('var(--income)')
    expect(transactionTypeColor('MANUAL_ADJUSTMENT', -500)).toBe('var(--expense)')
  })
})

describe('transactionTypeBadgeKind', () => {
  it('never returns expense for a positive manual adjustment', () => {
    expect(transactionTypeBadgeKind('MANUAL_ADJUSTMENT', 12800.5)).toBe('income')
  })

  it('returns expense for a negative manual adjustment', () => {
    expect(transactionTypeBadgeKind('MANUAL_ADJUSTMENT', -500)).toBe('expense')
  })

  it('falls back to a neutral kind when the amount is unknown', () => {
    expect(transactionTypeBadgeKind('MANUAL_ADJUSTMENT')).toBe('info')
  })
})

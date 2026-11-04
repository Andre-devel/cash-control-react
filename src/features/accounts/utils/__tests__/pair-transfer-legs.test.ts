import { describe, it, expect } from 'vitest'
import type { Transaction } from '@/features/transactions/types'
import { pairTransferLegs } from '../pair-transfer-legs'

function leg(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'leg',
    description: 'Transferência',
    amount: '0',
    type: 'TRANSFER',
    status: 'PAID',
    accountId: 'acc',
    categoryId: null,
    competenceDate: '2026-11-02',
    paymentDate: '2026-11-02',
    createdAt: '2026-11-02T12:00:00Z',
    paymentMethod: { id: 'pm', name: 'Transferência', slug: 'BANK_TRANSFER' },
    creditCard: null,
    ...overrides,
  } as Transaction
}

describe('pairTransferLegs', () => {
  it('joins the outgoing and incoming legs of the same transfer', () => {
    const pairs = pairTransferLegs([
      leg({ id: 'in', accountId: 'cdb', accountName: 'CDB teste', amount: '500' }),
      leg({ id: 'out', accountId: 'inter', accountName: 'Inter', amount: '-500.00' }),
    ])

    expect(pairs).toEqual([
      {
        id: 'out',
        fromAccountName: 'Inter',
        toAccountName: 'CDB teste',
        amount: 500,
        description: 'Transferência',
        competenceDate: '2026-11-02',
      },
    ])
  })

  it('keeps transfers with different amounts, dates or descriptions apart', () => {
    const pairs = pairTransferLegs([
      leg({ id: 'a-out', accountId: 'inter', accountName: 'Inter', amount: '-100' }),
      leg({ id: 'b-in', accountId: 'cdb', accountName: 'CDB', amount: '200' }),
      leg({
        id: 'c-in',
        accountId: 'cdb',
        accountName: 'CDB',
        amount: '100',
        competenceDate: '2026-11-01',
      }),
      leg({
        id: 'd-in',
        accountId: 'cdb',
        accountName: 'CDB',
        amount: '100',
        description: 'Aporte',
      }),
    ])

    expect(pairs).toHaveLength(4)
    expect(pairs[0]).toMatchObject({ fromAccountName: 'Inter', toAccountName: null })
    expect(pairs[1]).toMatchObject({ fromAccountName: null, toAccountName: 'CDB', amount: 200 })
  })

  it('does not pair two legs of the same account', () => {
    const pairs = pairTransferLegs([
      leg({ id: 'x', accountId: 'inter', accountName: 'Inter', amount: '-50' }),
      leg({ id: 'y', accountId: 'inter', accountName: 'Inter', amount: '50' }),
    ])

    expect(pairs).toHaveLength(2)
  })

  it('pairs two back-to-back transfers of the same value one to one', () => {
    const pairs = pairTransferLegs([
      leg({ id: 'in1', accountId: 'cdb', accountName: 'CDB', amount: '10' }),
      leg({ id: 'out1', accountId: 'inter', accountName: 'Inter', amount: '-10' }),
      leg({ id: 'in2', accountId: 'cdb', accountName: 'CDB', amount: '10' }),
      leg({ id: 'out2', accountId: 'inter', accountName: 'Inter', amount: '-10' }),
    ])

    expect(pairs.map((p) => p.id)).toEqual(['out1', 'out2'])
  })
})

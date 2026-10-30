import { describe, it, expect } from 'vitest'
import {
  holdingSchema,
  parseTreasuryBondValue,
  treasuryBondValue,
  type HoldingFormInput,
} from '../holding.schema'
import { redeemSchema } from '../redeem.schema'

const base: HoldingFormInput = {
  accountId: 'inv-1',
  kind: 'CDB',
  indexer: 'CDI_PERCENT',
  rate: '110',
  name: 'CDB Inter',
  issuer: '',
  taxExempt: false,
  liquidity: 'DAILY',
  appliedAt: '2026-03-10',
  maturityDate: '',
  principal: '1.000,00',
  treasuryBond: '',
  treasuryQuantity: '',
  funding: 'EXISTING',
  fromAccountId: '',
  notes: '',
}

function errorPaths(input: HoldingFormInput): string[] {
  const result = holdingSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('holdingSchema', () => {
  it('accepts a CDB and normalizes money and rate typed with a comma', () => {
    const result = holdingSchema.parse({ ...base, rate: '6,25', indexer: 'IPCA_SPREAD' })
    expect(result.principal).toBe('1000.00')
    expect(result.rate).toBe('6.25')
  })

  it('requires indexer and rate for CDB, LCI and LCA', () => {
    expect(errorPaths({ ...base, indexer: '', rate: '' })).toEqual(['indexer', 'rate'])
  })

  it('lets OTHER go without an indexer', () => {
    expect(errorPaths({ ...base, kind: 'OTHER', indexer: '', rate: '' })).toEqual([])
  })

  it('requires the bond for Tesouro, not the indexer', () => {
    expect(errorPaths({ ...base, kind: 'TESOURO_DIRETO', indexer: '', rate: '' })).toEqual([
      'treasuryBond',
    ])
  })

  it('requires the maturity for AT_MATURITY and after the application date', () => {
    expect(errorPaths({ ...base, liquidity: 'AT_MATURITY' })).toEqual(['maturityDate'])
    expect(errorPaths({ ...base, maturityDate: '2026-03-01' })).toEqual(['maturityDate'])
  })

  it('requires the source account when funding by transfer', () => {
    expect(errorPaths({ ...base, funding: 'TRANSFER' })).toEqual(['fromAccountId'])
  })

  it('rejects zero principal', () => {
    expect(errorPaths({ ...base, principal: '0' })).toEqual(['principal'])
  })
})

describe('treasury bond select value', () => {
  it('round-trips type and maturity', () => {
    expect(parseTreasuryBondValue(treasuryBondValue('Tesouro IPCA+', '2035-05-15'))).toEqual({
      bondType: 'Tesouro IPCA+',
      maturityDate: '2035-05-15',
    })
  })
})

describe('redeemSchema', () => {
  it('requires the gross amount only for a partial redemption', () => {
    const total = {
      date: '2026-10-29',
      mode: 'TOTAL',
      grossAmount: '',
      destination: 'STAY',
      netAmount: '',
    } as const
    expect(redeemSchema.safeParse(total).success).toBe(true)
    expect(redeemSchema.safeParse({ ...total, mode: 'PARTIAL' }).success).toBe(false)
    expect(
      redeemSchema.safeParse({ ...total, mode: 'PARTIAL', grossAmount: '500,00' }).success,
    ).toBe(true)
  })
})

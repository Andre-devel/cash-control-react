/** Valores decimais chegam da API como número ou texto; sempre ler com `Number()`. */
export type Decimal = number | string

export type FixedIncomeKind = 'CDB' | 'LCI' | 'LCA' | 'TESOURO_DIRETO' | 'OTHER'
export type FixedIncomeIndexer =
  | 'CDI_PERCENT'
  | 'CDI_SPREAD'
  | 'PREFIXED'
  | 'IPCA_SPREAD'
  | 'SELIC_PERCENT'
export type FixedIncomeLiquidity = 'DAILY' | 'AT_MATURITY'
export type FixedIncomeStatus = 'ACTIVE' | 'REDEEMED'
export type ValuationSource = 'CURVE' | 'MARKET' | 'MANUAL' | 'COST'
export type MarketIndex = 'CDI' | 'SELIC' | 'IPCA'

export interface Valuation {
  valuedAt: string
  principal: Decimal
  gross: Decimal
  incomeTax: Decimal
  iof: Decimal
  net: Decimal
  yield: Decimal
  incomeTaxRate: Decimal
  iofRate: Decimal
  daysHeld: number
  estimated: boolean
  source: ValuationSource
}

export interface FixedIncomeRedemption {
  id: string
  redeemedAt: string
  principalPortion: Decimal
  treasuryQuantity: Decimal | null
  gross: Decimal
  incomeTax: Decimal
  iof: Decimal
  net: Decimal
  yieldTransactionId: string | null
  transferGroupId: string | null
}

export interface FixedIncomeHolding {
  id: string
  accountId: string
  accountName: string
  kind: FixedIncomeKind
  indexer: FixedIncomeIndexer | null
  rate: Decimal | null
  name: string
  issuer: string | null
  taxExempt: boolean
  liquidity: FixedIncomeLiquidity
  appliedAt: string
  maturityDate: string | null
  principal: Decimal
  remainingPrincipal: Decimal
  treasuryBondType: string | null
  treasuryQuantity: Decimal | null
  manualValue: Decimal | null
  manualValueDate: string | null
  status: FixedIncomeStatus
  notes: string | null
  valuation: Valuation | null
  yieldPercent: Decimal | null
  cdiPercent: Decimal | null
  daysToMaturity: number | null
  redemptions: FixedIncomeRedemption[]
}

export interface AllocationSlice {
  key: string
  gross: Decimal
  percent: Decimal
}

export interface InvestmentSummary {
  totalPrincipal: Decimal
  totalGross: Decimal
  totalIncomeTax: Decimal
  totalIof: Decimal
  totalNet: Decimal
  totalYield: Decimal
  estimated: boolean
  byKind: AllocationSlice[]
  byIndexer: AllocationSlice[]
  byMaturity: AllocationSlice[]
  upcomingMaturities: { holdingId: string; name: string; maturityDate: string; net: Decimal }[]
  accounts: {
    accountId: string
    accountName: string
    balance: Decimal
    allocatedPrincipal: Decimal
    unallocated: Decimal
  }[]
}

export interface MarketIndexes {
  indexes: { index: MarketIndex; date: string | null; value: Decimal | null; stale: boolean }[]
  treasuryBaseDate: string | null
  treasuryStale: boolean
}

export interface TreasuryBond {
  bondType: string
  maturityDate: string
  baseDate: string
  buyRate: Decimal
  sellRate: Decimal
  puBuy: Decimal
  puSell: Decimal
  puBase: Decimal
}

export interface HoldingEvolution {
  points: { date: string; gross: Decimal; cdiBenchmark: Decimal }[]
}

export interface HoldingRequest {
  accountId: string
  kind: FixedIncomeKind
  indexer?: FixedIncomeIndexer | null
  rate?: string | null
  name: string
  issuer?: string | null
  taxExempt?: boolean
  liquidity?: FixedIncomeLiquidity
  appliedAt: string
  maturityDate?: string | null
  principal: string
  treasuryBondType?: string | null
  treasuryQuantity?: string | null
  fromAccountId?: string | null
  fundingTransferGroupId?: string | null
  notes?: string | null
}

export interface RedeemRequest {
  date: string
  total: boolean
  grossAmount?: string | null
  netAmount?: string | null
  toAccountId?: string | null
}

export interface RedemptionPreviewParams {
  date: string
  total: boolean
  grossAmount?: string
}

export interface ManualValueRequest {
  value: string | null
  date: string | null
}

import type {
  Decimal,
  FixedIncomeHolding,
  FixedIncomeIndexer,
  FixedIncomeKind,
  MarketIndex,
} from '@/features/investments/types'

export const KIND_LABELS: Record<FixedIncomeKind, string> = {
  CDB: 'CDB',
  LCI: 'LCI',
  LCA: 'LCA',
  TESOURO_DIRETO: 'Tesouro Direto',
  OTHER: 'Outro',
}

export const INDEXER_LABELS: Record<FixedIncomeIndexer, string> = {
  CDI_PERCENT: '% do CDI',
  CDI_SPREAD: 'CDI + taxa',
  PREFIXED: 'Prefixado',
  IPCA_SPREAD: 'IPCA + taxa',
  SELIC_PERCENT: '% da Selic',
}

/** Rótulos das chaves de alocação devolvidas pelo resumo. */
export const ALLOCATION_LABELS: Record<string, string> = {
  ...KIND_LABELS,
  ...INDEXER_LABELS,
  MARKET: 'Tesouro (mercado)',
  NONE: 'Sem indexador',
  DAILY: 'Liquidez diária',
  UP_TO_1Y: 'Até 1 ano',
  UP_TO_3Y: '1 a 3 anos',
  UP_TO_5Y: '3 a 5 anos',
  OVER_5Y: 'Mais de 5 anos',
}

export const MARKET_INDEX_LABELS: Record<MarketIndex, string> = {
  CDI: 'CDI',
  SELIC: 'Selic',
  IPCA: 'IPCA',
}

/** Cores das fatias, na ordem em que aparecem (maior primeiro). */
export const ALLOCATION_COLORS = [
  'var(--accent)',
  '#5B8DEF',
  '#F2A541',
  '#B07CE8',
  '#E5677D',
  '#6CC4C0',
  '#9AA4B2',
]

export function toNumber(value: Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

export function formatPercent(value: Decimal | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return '—'
  return `${toNumber(value).toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`
}

/** "110% do CDI", "CDI + 1,5% a.a.", "IPCA + 6,2% a.a.", "Tesouro Selic 2029". */
export function rateLabel(
  holding: Pick<
    FixedIncomeHolding,
    'kind' | 'indexer' | 'rate' | 'treasuryBondType' | 'maturityDate'
  >,
): string {
  if (holding.kind === 'TESOURO_DIRETO') {
    const year = holding.maturityDate?.slice(0, 4) ?? ''
    return `${holding.treasuryBondType ?? 'Tesouro'} ${year}`.trim()
  }
  if (!holding.indexer) return 'Valor informado'
  const rate = formatPercent(holding.rate, 4)
  switch (holding.indexer) {
    case 'CDI_PERCENT':
      return `${rate} do CDI`
    case 'SELIC_PERCENT':
      return `${rate} da Selic`
    case 'CDI_SPREAD':
      return `CDI + ${rate} a.a.`
    case 'IPCA_SPREAD':
      return `IPCA + ${rate} a.a.`
    case 'PREFIXED':
      return `Prefixado ${rate} a.a.`
  }
}

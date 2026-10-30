import { axiosInstance } from '@/services/http'
import type {
  FixedIncomeHolding,
  FixedIncomeStatus,
  HoldingEvolution,
  HoldingRequest,
  InvestmentSummary,
  ManualValueRequest,
  MarketIndexes,
  RedeemRequest,
  RedemptionPreviewParams,
  TreasuryBond,
  Valuation,
} from '@/features/investments/types'

export async function getInvestmentSummary(): Promise<InvestmentSummary> {
  const response = await axiosInstance.get<InvestmentSummary>('/investments/summary')
  return response.data
}

export async function getMarketIndexes(): Promise<MarketIndexes> {
  const response = await axiosInstance.get<MarketIndexes>('/investments/indexes/latest')
  return response.data
}

export async function listTreasuryBonds(): Promise<TreasuryBond[]> {
  const response = await axiosInstance.get<TreasuryBond[]>('/investments/treasury-bonds')
  return response.data
}

export async function listHoldings(status?: FixedIncomeStatus): Promise<FixedIncomeHolding[]> {
  const response = await axiosInstance.get<FixedIncomeHolding[]>('/investments/holdings', {
    params: status ? { status } : undefined,
  })
  return response.data
}

export async function getHoldingEvolution(id: string): Promise<HoldingEvolution> {
  const response = await axiosInstance.get<HoldingEvolution>(
    `/investments/holdings/${id}/evolution`,
  )
  return response.data
}

export async function createHolding(data: HoldingRequest): Promise<FixedIncomeHolding> {
  const response = await axiosInstance.post<FixedIncomeHolding>('/investments/holdings', data)
  return response.data
}

export async function updateHolding(id: string, data: HoldingRequest): Promise<FixedIncomeHolding> {
  const response = await axiosInstance.put<FixedIncomeHolding>(`/investments/holdings/${id}`, data)
  return response.data
}

export async function deleteHolding(id: string): Promise<void> {
  await axiosInstance.delete(`/investments/holdings/${id}`)
}

export async function setManualValue(
  id: string,
  data: ManualValueRequest,
): Promise<FixedIncomeHolding> {
  const response = await axiosInstance.put<FixedIncomeHolding>(
    `/investments/holdings/${id}/manual-value`,
    data,
  )
  return response.data
}

export async function previewRedemption(
  id: string,
  params: RedemptionPreviewParams,
): Promise<Valuation> {
  const response = await axiosInstance.get<Valuation>(
    `/investments/holdings/${id}/redemption-preview`,
    { params },
  )
  return response.data
}

export async function redeemHolding(id: string, data: RedeemRequest): Promise<FixedIncomeHolding> {
  const response = await axiosInstance.post<FixedIncomeHolding>(
    `/investments/holdings/${id}/redemptions`,
    data,
  )
  return response.data
}

import { axiosInstance } from '@/services/http'
import type {
  BankSyncOverview,
  BankSyncRunPage,
  BankSyncRunParams,
} from '@/features/bank-sync/types'

export async function getBankSyncOverview(): Promise<BankSyncOverview> {
  const response = await axiosInstance.get<BankSyncOverview>('/admin/bank-sync/overview')
  return response.data
}

export async function getBankSyncRuns({
  page,
  size,
  connectionId,
  outcome,
}: BankSyncRunParams): Promise<BankSyncRunPage> {
  const response = await axiosInstance.get<BankSyncRunPage>('/admin/bank-sync/runs', {
    // Lista em vírgulas: o Spring lê `outcome=ERROR,PARTIAL` como List, e não `outcome[]=`.
    params: { page, size, connectionId, outcome: outcome?.length ? outcome.join(',') : undefined },
  })
  return response.data
}

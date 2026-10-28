import { axiosInstance } from '@/services/http'
import type {
  ApplyReconciliationRequest,
  ApplyReconciliationResult,
  ImportReconciliationResponse,
} from '@/features/transactions/types'

export async function getImportReconciliation(): Promise<ImportReconciliationResponse> {
  const response = await axiosInstance.get<ImportReconciliationResponse>(
    '/transactions/import/reconciliation',
  )
  return response.data
}

export async function applyImportReconciliation(
  data: ApplyReconciliationRequest,
): Promise<ApplyReconciliationResult> {
  const response = await axiosInstance.post<ApplyReconciliationResult>(
    '/transactions/import/reconciliation',
    data,
  )
  return response.data
}

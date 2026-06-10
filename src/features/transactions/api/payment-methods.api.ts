import { axiosInstance } from '@/services/http'
import type { PaymentMethod } from '@/features/transactions/types'

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await axiosInstance.get<PaymentMethod[]>('/payment-methods')
  return response.data
}

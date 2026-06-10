import { useQuery } from '@tanstack/react-query'
import { listPaymentMethods } from '@/features/transactions/api/payment-methods.api'
import type { PaymentMethod } from '@/features/transactions/types'
import type { UseQueryResult } from '@tanstack/react-query'

export const PAYMENT_METHODS_QUERY_KEY = ['payment-methods'] as const

export function usePaymentMethods(): UseQueryResult<PaymentMethod[]> {
  return useQuery({
    queryKey: PAYMENT_METHODS_QUERY_KEY,
    queryFn: listPaymentMethods,
    staleTime: Infinity,
  })
}

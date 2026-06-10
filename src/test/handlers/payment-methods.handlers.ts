import { http, HttpResponse } from 'msw'
import type { PaymentMethod } from '@/features/transactions/types'

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', slug: 'CASH', name: 'Dinheiro' },
  { id: 'pm-2', slug: 'PIX', name: 'Pix' },
  { id: 'pm-3', slug: 'DEBIT_CARD', name: 'Cartão de Débito' },
  { id: 'pm-4', slug: 'CREDIT_CARD', name: 'Cartão de Crédito' },
  { id: 'pm-5', slug: 'BANK_TRANSFER', name: 'Transferência Bancária' },
  { id: 'pm-6', slug: 'BOLETO', name: 'Boleto' },
  { id: 'pm-7', slug: 'OTHER', name: 'Outro' },
]

export const MOCK_PAYMENT_METHOD_OTHER = MOCK_PAYMENT_METHODS[6] as PaymentMethod

export const paymentMethodsHandlers = [
  http.get('*/payment-methods', () => {
    return HttpResponse.json(MOCK_PAYMENT_METHODS)
  }),
]

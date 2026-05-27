import { http, HttpResponse } from 'msw'
import type { InstallmentSeries } from '@/features/installments/types'

export const MOCK_SERIES_1: InstallmentSeries = {
  id: 'series-1',
  description: 'New laptop',
  totalAmount: '3600.00',
  installmentCount: 12,
  paidCount: 3,
  remainingAmount: '2700.00',
  accountId: 'account-1',
  categoryId: 'cat-1',
  firstDueDate: '2026-01-01',
  nextDueDate: '2026-04-01',
  type: 'EXPENSE',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_SERIES_2: InstallmentSeries = {
  id: 'series-2',
  description: 'Smartphone',
  totalAmount: '1200.00',
  installmentCount: 6,
  paidCount: 6,
  remainingAmount: '0.00',
  accountId: 'account-1',
  categoryId: null,
  firstDueDate: '2025-07-01',
  nextDueDate: null,
  type: 'EXPENSE',
  status: 'SETTLED',
  createdAt: '2025-07-01T00:00:00Z',
}

let seriesStore: InstallmentSeries[] = [MOCK_SERIES_1, MOCK_SERIES_2]

export function resetInstallmentsStore() {
  seriesStore = [MOCK_SERIES_1, MOCK_SERIES_2]
}

export const installmentsHandlers = [
  http.get('*/installments/series', () => {
    return HttpResponse.json(seriesStore)
  }),

  http.post('*/installments', async ({ request }) => {
    const body = (await request.json()) as Omit<
      InstallmentSeries,
      'id' | 'paidCount' | 'remainingAmount' | 'nextDueDate' | 'status' | 'createdAt'
    > & { installmentCount: number; totalAmount: string }
    const created: InstallmentSeries = {
      id: `series-${Date.now()}`,
      paidCount: 0,
      remainingAmount: body.totalAmount,
      nextDueDate: body.firstDueDate,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      ...body,
      categoryId: body.categoryId ?? null,
    }
    seriesStore = [...seriesStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/installments/series/:seriesId', async ({ params, request }) => {
    const body = (await request.json()) as Partial<InstallmentSeries>
    seriesStore = seriesStore.map((s) => (s.id === params.seriesId ? { ...s, ...body } : s))
    const updated = seriesStore.find((s) => s.id === params.seriesId)
    return HttpResponse.json(updated)
  }),

  http.put('*/installments/:transactionId', async () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/installments/series/:seriesId/settle', ({ params }) => {
    seriesStore = seriesStore.map((s) =>
      s.id === params.seriesId
        ? {
            ...s,
            status: 'SETTLED',
            paidCount: s.installmentCount,
            remainingAmount: '0.00',
            nextDueDate: null,
          }
        : s,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/installments/advance', async () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

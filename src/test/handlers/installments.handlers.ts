import { http, HttpResponse } from 'msw'
import type {
  InstallmentSeries,
  InstallmentSeriesDetail,
  InstallmentTransaction,
} from '@/features/installments/types'

export const MOCK_TRANSACTIONS_SERIES_1: InstallmentTransaction[] = [
  {
    id: 'inst-1',
    description: 'New laptop #1',
    amount: '300.00',
    competenceDate: '2026-01-01',
    status: 'PAID',
    installmentNumber: 1,
  },
  {
    id: 'inst-2',
    description: 'New laptop #2',
    amount: '300.00',
    competenceDate: '2026-02-01',
    status: 'PAID',
    installmentNumber: 2,
  },
  {
    id: 'inst-3',
    description: 'New laptop #3',
    amount: '300.00',
    competenceDate: '2026-03-01',
    status: 'PAID',
    installmentNumber: 3,
  },
  {
    id: 'inst-4',
    description: 'New laptop #4',
    amount: '300.00',
    competenceDate: '2026-04-01',
    status: 'PENDING',
    installmentNumber: 4,
  },
  {
    id: 'inst-5',
    description: 'New laptop #5',
    amount: '300.00',
    competenceDate: '2026-05-01',
    status: 'PENDING',
    installmentNumber: 5,
  },
  {
    id: 'inst-6',
    description: 'New laptop #6',
    amount: '300.00',
    competenceDate: '2026-06-01',
    status: 'PENDING',
    installmentNumber: 6,
  },
]

export const MOCK_SERIES_1: InstallmentSeries = {
  id: 'series-1',
  description: 'New laptop',
  totalAmount: '3600.00',
  totalInstallments: 12,
  accountId: 'account-1',
  categoryId: 'cat-1',
  firstPaymentDate: '2026-01-01',
  settled: false,
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_SERIES_2: InstallmentSeries = {
  id: 'series-2',
  description: 'Smartphone',
  totalAmount: '1200.00',
  totalInstallments: 6,
  accountId: 'account-1',
  categoryId: null,
  firstPaymentDate: '2025-07-01',
  settled: true,
  settledAt: '2026-01-01T00:00:00Z',
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

  http.get('*/installments/series/:seriesId', ({ params }) => {
    const series = seriesStore.find((s) => s.id === params.seriesId)
    if (!series) {
      return HttpResponse.json(
        {
          errorCode: 'INSTALLMENT_SERIES_NOT_FOUND',
          message: 'Series not found.',
          correlationId: 'test-id',
        },
        { status: 404 },
      )
    }
    const installments = series.id === MOCK_SERIES_1.id ? MOCK_TRANSACTIONS_SERIES_1 : []
    const detail: InstallmentSeriesDetail = { series, installments }
    return HttpResponse.json(detail)
  }),

  http.post('*/installments', async ({ request }) => {
    const body = (await request.json()) as {
      description: string
      totalAmount: string
      totalInstallments: number
      accountId: string
      categoryId?: string | null
      firstPaymentDate: string
    }
    const created: InstallmentSeries = {
      id: `series-${Date.now()}`,
      description: body.description,
      totalAmount: body.totalAmount,
      totalInstallments: body.totalInstallments,
      accountId: body.accountId,
      categoryId: body.categoryId ?? null,
      firstPaymentDate: body.firstPaymentDate,
      settled: false,
      createdAt: new Date().toISOString(),
    }
    seriesStore = [...seriesStore, created]
    const detail: InstallmentSeriesDetail = { series: created, installments: [] }
    return HttpResponse.json(detail, { status: 201 })
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
      s.id === params.seriesId ? { ...s, settled: true, settledAt: new Date().toISOString() } : s,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/installments/advance', async () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

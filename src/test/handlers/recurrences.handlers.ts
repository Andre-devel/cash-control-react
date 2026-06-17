import { http, HttpResponse } from 'msw'
import type { Recurrence } from '@/features/recurrences/types'

export const MOCK_RECURRENCE_1: Recurrence = {
  id: 'recurrence-1',
  description: 'Monthly rent',
  amount: '1500.00',
  type: 'EXPENSE',
  frequency: 'MONTHLY',
  accountId: 'account-1',
  categoryId: 'category-1',
  startDate: '2026-01-01',
  nextOccurrenceDate: '2026-06-01',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_RECURRENCE_2: Recurrence = {
  id: 'recurrence-2',
  description: 'Netflix subscription',
  amount: '39.90',
  type: 'EXPENSE',
  frequency: 'MONTHLY',
  accountId: 'account-1',
  categoryId: null,
  startDate: '2026-01-01',
  nextOccurrenceDate: '2026-06-10',
  status: 'PAUSED',
  resumeAt: '2026-07-01',
  createdAt: '2026-01-01T00:00:00Z',
}

let recurrencesStore: Recurrence[] = [MOCK_RECURRENCE_1, MOCK_RECURRENCE_2]

export function resetRecurrencesStore() {
  recurrencesStore = [MOCK_RECURRENCE_1, MOCK_RECURRENCE_2]
}

export const recurrencesHandlers = [
  http.get('*/recurrences', () => {
    return HttpResponse.json(recurrencesStore)
  }),

  http.get('*/recurrences/:id', ({ params }) => {
    const recurrence = recurrencesStore.find((r) => r.id === params.id)
    if (!recurrence) {
      return HttpResponse.json(
        {
          errorCode: 'RECURRENCE_NOT_FOUND',
          message: 'Recurrence not found.',
          correlationId: 'test-id',
        },
        { status: 404 },
      )
    }
    return HttpResponse.json(recurrence)
  }),

  http.post('*/recurrences', async ({ request }) => {
    const body = (await request.json()) as Omit<
      Recurrence,
      'id' | 'status' | 'nextOccurrenceDate' | 'createdAt'
    >
    const created: Recurrence = {
      id: `recurrence-${Date.now()}`,
      status: 'ACTIVE',
      nextOccurrenceDate: body.startDate,
      createdAt: new Date().toISOString(),
      ...body,
      categoryId: body.categoryId ?? null,
    }
    recurrencesStore = [...recurrencesStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/recurrences/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Recurrence>
    recurrencesStore = recurrencesStore.map((r) => (r.id === params.id ? { ...r, ...body } : r))
    const updated = recurrencesStore.find((r) => r.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.post('*/recurrences/:id/pause', async ({ params, request }) => {
    let resumeAt: string | undefined
    try {
      const body = (await request.json()) as { resumeAt?: string }
      resumeAt = body.resumeAt
    } catch {
      // body is optional
    }
    recurrencesStore = recurrencesStore.map((r) =>
      r.id === params.id
        ? { ...r, status: 'PAUSED' as const, ...(resumeAt ? { resumeAt } : {}) }
        : r,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/recurrences/:id/resume', ({ params }) => {
    recurrencesStore = recurrencesStore.map((r) =>
      r.id === params.id ? { ...r, status: 'ACTIVE' as const, resumeAt: undefined } : r,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('*/recurrences/:id', ({ params }) => {
    recurrencesStore = recurrencesStore.filter((r) => r.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),
]

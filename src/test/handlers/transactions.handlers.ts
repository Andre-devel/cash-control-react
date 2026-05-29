import { http, HttpResponse } from 'msw'
import type { Transaction, Attachment, PaginatedResponse } from '@/features/transactions/types'

export const MOCK_TRANSACTION_1: Transaction = {
  id: 'tx-1',
  description: 'Supermarket',
  amount: '150.75',
  type: 'EXPENSE',
  status: 'PAID',
  accountId: 'account-1',
  categoryId: 'cat-1',
  competenceDate: '2026-05-01',
  paymentDate: '2026-05-01',
  createdAt: '2026-05-01T10:00:00Z',
}

export const MOCK_TRANSACTION_2: Transaction = {
  id: 'tx-2',
  description: 'Monthly salary',
  amount: '5000.00',
  type: 'INCOME',
  status: 'PAID',
  accountId: 'account-1',
  categoryId: 'cat-2',
  competenceDate: '2026-05-05',
  paymentDate: '2026-05-05',
  createdAt: '2026-05-05T08:00:00Z',
}

export const MOCK_TRANSACTION_PENDING: Transaction = {
  id: 'tx-3',
  description: 'Internet bill',
  amount: '89.90',
  type: 'EXPENSE',
  status: 'PENDING',
  accountId: 'account-1',
  categoryId: null,
  competenceDate: '2026-05-10',
  paymentDate: null,
  createdAt: '2026-05-10T00:00:00Z',
}

export const MOCK_TRANSACTION_CANCELLED: Transaction = {
  id: 'tx-4',
  description: 'Cancelled purchase',
  amount: '299.00',
  type: 'EXPENSE',
  status: 'CANCELLED',
  accountId: 'account-1',
  categoryId: null,
  competenceDate: '2026-05-15',
  paymentDate: null,
  createdAt: '2026-05-15T00:00:00Z',
}

export const MOCK_TRANSFER_TX: Transaction = {
  id: 'tx-transfer-1',
  description: 'Nubank → Savings',
  amount: '500.00',
  type: 'TRANSFER',
  status: 'PAID',
  accountId: 'account-1',
  categoryId: null,
  competenceDate: '2026-05-04',
  paymentDate: '2026-05-04',
  createdAt: '2026-05-04T10:00:00Z',
}

export const MOCK_ATTACHMENT_1: Attachment = {
  id: 'att-1',
  transactionId: 'tx-1',
  fileName: 'receipt.pdf',
  contentType: 'application/pdf',
  size: 12345,
  url: 'https://example.com/receipts/receipt.pdf',
  createdAt: '2026-05-01T10:05:00Z',
}

let transactionsStore: Transaction[] = [
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_2,
  MOCK_TRANSACTION_PENDING,
  MOCK_TRANSACTION_CANCELLED,
  MOCK_TRANSFER_TX,
]

let attachmentsStore: Attachment[] = [MOCK_ATTACHMENT_1]

export function resetTransactionsStore() {
  transactionsStore = [
    MOCK_TRANSACTION_1,
    MOCK_TRANSACTION_2,
    MOCK_TRANSACTION_PENDING,
    MOCK_TRANSACTION_CANCELLED,
    MOCK_TRANSFER_TX,
  ]
  attachmentsStore = [MOCK_ATTACHMENT_1]
}

function makePaginatedResponse<T>(items: T[], page: number, size: number): PaginatedResponse<T> {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const content = items.slice(start, start + size)
  return { content, totalElements, totalPages, number: page, size }
}

export const transactionsHandlers = [
  http.get('*/transactions', ({ request }) => {
    const url = new URL(request.url)
    const includeCancelled = url.searchParams.get('includeCancelled') === 'true'
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const accountId = url.searchParams.get('accountId')
    const searchText = url.searchParams.get('searchText')
    const page = parseInt(url.searchParams.get('page') ?? '0', 10)
    const size = parseInt(url.searchParams.get('size') ?? '20', 10)

    let result = transactionsStore

    if (!includeCancelled) result = result.filter((t) => t.status !== 'CANCELLED')
    if (type) result = result.filter((t) => t.type === type)
    if (status) result = result.filter((t) => t.status === status)
    if (accountId) result = result.filter((t) => t.accountId === accountId)
    if (searchText) {
      const lower = searchText.toLowerCase()
      result = result.filter((t) => t.description.toLowerCase().includes(lower))
    }

    return HttpResponse.json(makePaginatedResponse(result, page, size))
  }),

  http.get('*/transactions/:id', ({ params }) => {
    const tx = transactionsStore.find((t) => t.id === params.id)
    if (!tx) {
      return HttpResponse.json(
        {
          errorCode: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found.',
          correlationId: 'test-id',
        },
        { status: 404 },
      )
    }
    return HttpResponse.json(tx)
  }),

  http.post('*/transactions', async ({ request }) => {
    const body = (await request.json()) as Omit<Transaction, 'id' | 'paymentDate' | 'createdAt'>
    const created: Transaction = {
      id: `tx-${Date.now()}`,
      paymentDate: body.status === 'PAID' ? body.competenceDate : null,
      createdAt: new Date().toISOString(),
      ...body,
      categoryId: body.categoryId ?? null,
    }
    transactionsStore = [...transactionsStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/transactions/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Transaction>
    transactionsStore = transactionsStore.map((t) => (t.id === params.id ? { ...t, ...body } : t))
    const updated = transactionsStore.find((t) => t.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.delete('*/transactions/:id', ({ params }) => {
    transactionsStore = transactionsStore.filter((t) => t.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/transactions/:id/pay', async ({ params, request }) => {
    let paymentDate = new Date().toISOString().split('T')[0]
    try {
      const body = (await request.json()) as { paymentDate?: string }
      if (body?.paymentDate) paymentDate = body.paymentDate
    } catch {
      // body may be empty
    }
    transactionsStore = transactionsStore.map((t) =>
      t.id === params.id ? { ...t, status: 'PAID', paymentDate } : t,
    )
    const updated = transactionsStore.find((t) => t.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.post('*/transactions/:id/cancel', ({ params }) => {
    transactionsStore = transactionsStore.map((t) =>
      t.id === params.id ? { ...t, status: 'CANCELLED' } : t,
    )
    const updated = transactionsStore.find((t) => t.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.get('*/transactions/:id/attachments', ({ params }) => {
    const txAttachments = attachmentsStore.filter((a) => a.transactionId === params.id)
    return HttpResponse.json(txAttachments)
  }),

  http.post('*/transactions/:id/attachments', async ({ params }) => {
    // Note: request.formData() hangs in the JSDOM+Axios multipart environment because
    // Axios sets Content-Type: multipart/form-data without a boundary parameter. The
    // "files" field-name regression guard is enforced at the unit-test level in
    // transactions-phase4.test.tsx (spy on axiosInstance.post + formData.get assertion).
    const created: Attachment = {
      id: `att-${Date.now()}`,
      transactionId: params.id as string,
      fileName: 'uploaded-file.pdf',
      contentType: 'application/pdf',
      size: 1024,
      url: 'https://example.com/uploads/uploaded-file.pdf',
      createdAt: new Date().toISOString(),
    }
    attachmentsStore = [...attachmentsStore, created]
    return HttpResponse.json([created], { status: 201 })
  }),

  http.delete('*/transactions/:id/attachments/:attachmentId', ({ params }) => {
    attachmentsStore = attachmentsStore.filter((a) => a.id !== params.attachmentId)
    return new HttpResponse(null, { status: 204 })
  }),
]

import { http, HttpResponse } from 'msw'
import type {
  Transaction,
  Attachment,
  PaginatedResponse,
  ImportCommitRequest,
  ImportPreviewResponse,
} from '@/features/transactions/types'
import {
  MOCK_PAYMENT_METHOD_OTHER,
  MOCK_PAYMENT_METHODS,
} from '@/test/handlers/payment-methods.handlers'

const MOCK_PAYMENT_METHOD_CASH = MOCK_PAYMENT_METHODS.find((pm) => pm.slug === 'CASH')!
const MOCK_PAYMENT_METHOD_CREDIT_CARD = MOCK_PAYMENT_METHODS.find(
  (pm) => pm.slug === 'CREDIT_CARD',
)!

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
  paymentMethod: MOCK_PAYMENT_METHOD_OTHER,
  creditCard: null,
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
  paymentMethod: MOCK_PAYMENT_METHOD_OTHER,
  creditCard: null,
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
  paymentMethod: MOCK_PAYMENT_METHOD_OTHER,
  creditCard: null,
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
  paymentMethod: MOCK_PAYMENT_METHOD_OTHER,
  creditCard: null,
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
  paymentMethod: MOCK_PAYMENT_METHOD_OTHER,
  creditCard: null,
}

export const MOCK_TRANSACTION_CASH: Transaction = {
  id: 'tx-cash-1',
  description: 'Cash payment',
  amount: '25.00',
  type: 'EXPENSE',
  status: 'PAID',
  accountId: 'account-1',
  categoryId: 'cat-1',
  competenceDate: '2026-05-06',
  paymentDate: '2026-05-06',
  createdAt: '2026-05-06T09:00:00Z',
  paymentMethod: MOCK_PAYMENT_METHOD_CASH,
  creditCard: null,
}

export const MOCK_TRANSACTION_CREDIT_CARD: Transaction = {
  id: 'tx-cc-1',
  description: 'Credit card purchase',
  amount: '199.90',
  type: 'EXPENSE',
  status: 'PENDING',
  accountId: 'account-1',
  categoryId: 'cat-1',
  competenceDate: '2026-05-07',
  paymentDate: null,
  createdAt: '2026-05-07T11:00:00Z',
  paymentMethod: MOCK_PAYMENT_METHOD_CREDIT_CARD,
  creditCard: { id: 'card-1', name: 'Nubank', brand: 'VISA' },
}

export const MOCK_ATTACHMENT_1: Attachment = {
  id: 'att-1',
  originalFilename: 'receipt.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 12345,
  uploadedAt: '2026-05-01T10:05:00Z',
}

// A API não devolve a transação dona do anexo; o mock guarda para filtrar a listagem.
type StoredAttachment = Attachment & { transactionId: string }

let transactionsStore: Transaction[] = [
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_2,
  MOCK_TRANSACTION_PENDING,
  MOCK_TRANSACTION_CANCELLED,
  MOCK_TRANSFER_TX,
  MOCK_TRANSACTION_CASH,
  MOCK_TRANSACTION_CREDIT_CARD,
]

let attachmentsStore: StoredAttachment[] = [{ ...MOCK_ATTACHMENT_1, transactionId: 'tx-1' }]

export function resetTransactionsStore() {
  transactionsStore = [
    MOCK_TRANSACTION_1,
    MOCK_TRANSACTION_2,
    MOCK_TRANSACTION_PENDING,
    MOCK_TRANSACTION_CANCELLED,
    MOCK_TRANSFER_TX,
    MOCK_TRANSACTION_CASH,
    MOCK_TRANSACTION_CREDIT_CARD,
  ]
  attachmentsStore = [{ ...MOCK_ATTACHMENT_1, transactionId: 'tx-1' }]
}

/**
 * Acrescenta um anexo ao store, como faria um upload bem-sucedido.
 *
 * Exposto porque o upload real não pode ser exercido em jsdom (o XHR trava num POST
 * multipart com arquivo): os testes que verificam "depois de enviar, a lista recarrega
 * e mostra o anexo novo" mockam o transporte e chamam isto para produzir o efeito.
 */
export function addMockAttachment(
  transactionId: string,
  fileName = 'uploaded-file.pdf',
): Attachment {
  const created: Attachment = {
    id: `att-${Date.now()}`,
    originalFilename: fileName,
    mimeType: 'application/pdf',
    fileSizeBytes: 1024,
    uploadedAt: new Date().toISOString(),
  }
  attachmentsStore = [...attachmentsStore, { ...created, transactionId }]
  return created
}

function makePaginatedResponse<T>(items: T[], page: number, size: number): PaginatedResponse<T> {
  const totalElements = items.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const content = items.slice(start, start + size)
  return { content, totalElements, totalPages, number: page, size }
}

export const MOCK_IMPORT_PREVIEW: ImportPreviewResponse = {
  fileName: 'extrato-inter.csv',
  format: 'INTER_CSV',
  sourceAccountLabel: '323236715',
  periodStart: '2026-05-01',
  periodEnd: '2026-08-04',
  totalRows: 3,
  importableCount: 2,
  duplicateCount: 1,
  warningCount: 1,
  investmentAccountMissing: false,
  keepCurrentBalanceSuggested: false,
  rows: [
    {
      lineNumber: 7,
      externalRef: 'ref-nova',
      date: '2026-08-04',
      description: 'Pix Marketplace',
      rawHistory: 'Pix enviado',
      amount: '144.06',
      type: 'EXPENSE',
      paymentMethod: 'PIX',
      // Igual ao que categories.handlers devolve para 'cat-1': a célula de categoria
      // resolve o nome pela lista de categorias e cai no nome da prévia só enquanto ela
      // carrega. Nomes diferentes deixariam o teste dependente dessa corrida.
      merchantKey: 'pix marketplace',
      suggestedDescription: null,
      suggestedCategoryId: 'cat-1',
      suggestedCategoryName: 'Food',
      suggestedSubcategoryId: null,
      suggestedSubcategoryName: null,
      suggestionSource: 'HISTORY',
      duplicate: false,
      unknownHistory: false,
      outgoing: true,
      transferAccountId: null,
      transferAccountName: null,
      invoiceId: null,
      invoiceLabel: null,
      invoiceAmountMismatch: false,
      invoiceOptions: [],
      investment: false,
      invoicePaymentUnmatched: false,
    },
    {
      lineNumber: 8,
      externalRef: 'ref-ja-importada',
      date: '2026-08-02',
      description: 'Dias E Damasceno Ltda',
      rawHistory: 'Compra no débito',
      amount: '70.00',
      type: 'EXPENSE',
      paymentMethod: 'DEBIT_CARD',
      merchantKey: 'dias e damasceno ltda',
      // Estabelecimento que o usuário já renomeou numa importação anterior.
      suggestedDescription: 'Padaria do Dias',
      suggestedCategoryId: null,
      suggestedCategoryName: null,
      suggestedSubcategoryId: null,
      suggestedSubcategoryName: null,
      suggestionSource: 'NONE',
      duplicate: true,
      unknownHistory: false,
      outgoing: true,
      transferAccountId: null,
      transferAccountName: null,
      invoiceId: null,
      invoiceLabel: null,
      invoiceAmountMismatch: false,
      invoiceOptions: [],
      investment: false,
      invoicePaymentUnmatched: false,
    },
    {
      lineNumber: 9,
      externalRef: 'ref-revisar',
      date: '2026-05-14',
      description: 'Tarifa Cesta B',
      rawHistory: 'Estorno de tarifa avulsa',
      amount: '12.34',
      type: 'INCOME',
      paymentMethod: 'OTHER',
      merchantKey: 'tarifa cesta b',
      suggestedDescription: null,
      suggestedCategoryId: null,
      suggestedCategoryName: null,
      suggestedSubcategoryId: null,
      suggestedSubcategoryName: null,
      suggestionSource: 'NONE',
      duplicate: false,
      unknownHistory: true,
      outgoing: true,
      transferAccountId: null,
      transferAccountName: null,
      invoiceId: null,
      invoiceLabel: null,
      invoiceAmountMismatch: false,
      invoiceOptions: [],
      investment: false,
      invoicePaymentUnmatched: false,
    },
  ],
  errors: [{ lineNumber: 24, message: "Data inválida: '32/13/2026'. Esperado dd/mm/aaaa." }],
}

/** Última chamada de confirmação recebida, para os testes inspecionarem o payload. */
let lastImportCommit: ImportCommitRequest | null = null

export function getLastImportCommit(): ImportCommitRequest | null {
  return lastImportCommit
}

export function resetImportStore() {
  lastImportCommit = null
}

function filterStore(params: URLSearchParams): Transaction[] {
  const type = params.get('type')
  const status = params.get('status')
  const accountId = params.get('accountId')
  const paymentMethod = params.get('paymentMethod')
  const searchText = params.get('searchText')

  let result = transactionsStore
  if (params.get('includeCancelled') !== 'true') {
    result = result.filter((t) => t.status !== 'CANCELLED')
  }
  if (type) result = result.filter((t) => t.type === type)
  if (status) result = result.filter((t) => t.status === status)
  if (accountId) result = result.filter((t) => t.accountId === accountId)
  if (paymentMethod) result = result.filter((t) => t.paymentMethod.slug === paymentMethod)
  if (searchText) {
    const lower = searchText.toLowerCase()
    result = result.filter((t) => t.description.toLowerCase().includes(lower))
  }
  return result
}

export const transactionsHandlers = [
  // A prévia não tem handler: o XHR do jsdom trava num POST multipart com arquivo, então
  // os testes de tela mockam `previewStatementImport` diretamente e usam MOCK_IMPORT_PREVIEW.
  // A confirmação é JSON e passa por aqui normalmente.
  // Precisa vir antes de `*/transactions/:id`, senão "import" seria capturado como um id.
  http.post('*/transactions/import', async ({ request }) => {
    const body = (await request.json()) as ImportCommitRequest
    lastImportCommit = body
    return HttpResponse.json(
      { imported: body.rows.length, skippedDuplicates: 0, failed: 0, errors: [] },
      { status: 201 },
    )
  }),

  // Precisa vir antes de `*/transactions/:id`, senão "summary" seria capturado como um id.
  http.get('*/transactions/summary', ({ request }) => {
    const result = filterStore(new URL(request.url).searchParams).filter(
      (t) => t.status !== 'CANCELLED',
    )
    const total = (types: string[]) => {
      const rows = result.filter((t) => types.includes(t.type))
      return { amount: rows.reduce((s, t) => s + Number(t.amount), 0), count: rows.length }
    }
    const income = total(['INCOME', 'REFUND'])
    const expense = total(['EXPENSE'])
    const invoice = total(['INVOICE_PAYMENT'])
    return HttpResponse.json({
      incomeAmount: income.amount.toFixed(2),
      incomeCount: income.count,
      expenseAmount: expense.amount.toFixed(2),
      expenseCount: expense.count,
      invoicePaymentAmount: invoice.amount.toFixed(2),
      invoicePaymentCount: invoice.count,
      netAmount: (income.amount - expense.amount).toFixed(2),
    })
  }),

  http.get('*/transactions', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') ?? '0', 10)
    const size = parseInt(url.searchParams.get('size') ?? '20', 10)
    return HttpResponse.json(makePaginatedResponse(filterStore(url.searchParams), page, size))
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
      paymentMethod: body.paymentMethod ?? MOCK_PAYMENT_METHOD_OTHER,
      creditCard: body.creditCard ?? null,
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

  http.post('*/transactions/:id/reactivate', ({ params }) => {
    transactionsStore = transactionsStore.map((t) =>
      t.id === params.id ? { ...t, status: 'PENDING' } : t,
    )
    return HttpResponse.json(transactionsStore.find((t) => t.id === params.id))
  }),

  http.get('*/transactions/:id/attachments', ({ params }) => {
    const txAttachments = attachmentsStore
      .filter((a) => a.transactionId === params.id)
      .map(({ transactionId: _owner, ...attachment }) => attachment)
    return HttpResponse.json(txAttachments)
  }),

  // O XHR do jsdom não completa um POST multipart com arquivo, então nenhum teste
  // chega neste handler pelo caminho real — os que precisam do efeito no store chamam
  // `addMockAttachment` direto. O handler fica porque é a rota de fallback caso algum
  // teste futuro poste aqui, e não lê o corpo justamente por isso.
  http.post('*/transactions/:id/attachments', ({ params }) =>
    HttpResponse.json([addMockAttachment(params.id as string)], { status: 201 }),
  ),

  http.delete('*/transactions/:id/attachments/:attachmentId', ({ params }) => {
    attachmentsStore = attachmentsStore.filter((a) => a.id !== params.attachmentId)
    return new HttpResponse(null, { status: 204 })
  }),
]

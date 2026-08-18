import { http, HttpResponse } from 'msw'
import type {
  Card,
  FaturaImportCommitRequest,
  FaturaImportPreviewResponse,
  Invoice,
  LimitUsage,
  SpendingItem,
} from '@/features/cards/types'

export const MOCK_CARD_1: Card = {
  id: 'card-1',
  name: 'Nubank',
  brand: 'VISA',
  issuer: 'Nu Pagamentos S.A.',
  last4Digits: '7866',
  creditLimit: '5000.00',
  currentInvoiceTotal: '800.00',
  closingDay: 1,
  dueDay: 10,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_CARD_2: Card = {
  id: 'card-2',
  name: 'Itaú',
  brand: 'MASTERCARD',
  last4Digits: '4776',
  creditLimit: '10000.00',
  closingDay: 15,
  dueDay: 25,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_INVOICE: Invoice = {
  id: 'invoice-1',
  creditCardId: 'card-1',
  referenceMonth: '2026-05',
  closingDate: '2026-05-01',
  totalAmount: '800.00',
  paidAmount: '300.00',
  status: 'PARTIALLY_PAID',
  dueDate: '2026-06-10',
  items: [
    {
      id: 'item-1',
      description: 'Supermarket',
      amount: '350.00',
      competenceDate: '2026-05-10',
      categoryId: 'category-1',
    },
    {
      id: 'item-2',
      description: 'Gas station',
      amount: '450.00',
      competenceDate: '2026-05-15',
      categoryId: null,
    },
  ],
}

export const MOCK_LIMIT_USAGE: LimitUsage = {
  creditLimit: '5000.00',
  usedLimit: '800.00',
  availableLimit: '4200.00',
  usagePercentage: '16.00',
}

export const MOCK_SPENDING: SpendingItem[] = [
  {
    categoryId: 'category-1',
    categoryName: 'Food',
    totalAmount: '350.00',
    percentage: '43.75',
  },
  {
    categoryId: null,
    categoryName: null,
    totalAmount: '450.00',
    percentage: '56.25',
  },
]

/**
 * Prévia com duas seções de cartão, como um PDF do Inter que cobre titular e
 * adicional: a primeira já casou por `last4Digits`, a segunda não casou com nada e
 * obriga a escolha manual.
 */
export const MOCK_FATURA_PREVIEW: FaturaImportPreviewResponse = {
  fileName: 'fatura-inter-2026-07.pdf',
  format: 'INTER_FATURA_PDF',
  dueDate: '2026-08-07',
  referenceMonth: '2026-07',
  totalAmount: '1617.29',
  totalRows: 3,
  duplicateCount: 1,
  excludedPaymentsCount: 1,
  errors: [{ lineNumber: 61, message: "Valor inválido: 'R$ --'" }],
  groups: [
    {
      cardLast4: '7866',
      suggestedCreditCardId: 'card-1',
      suggestedCreditCardName: 'Nubank',
      rows: [
        {
          lineNumber: 59,
          externalRef: 'ref-nova',
          ordinal: 0,
          date: '2026-04-04',
          description: 'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
          amount: '55.19',
          installmentNumber: 4,
          totalInstallments: 5,
          // Igual ao que categories.handlers devolve para 'cat-1'.
          suggestedCategoryId: 'cat-1',
          suggestedCategoryName: 'Food',
          duplicate: false,
        },
        {
          lineNumber: 60,
          externalRef: 'ref-ja-importada',
          ordinal: 0,
          date: '2026-07-15',
          description: 'ANTHROPIC* CLAUDE SUB',
          amount: '110.00',
          installmentNumber: null,
          totalInstallments: null,
          suggestedCategoryId: null,
          suggestedCategoryName: null,
          duplicate: true,
        },
      ],
    },
    {
      cardLast4: '9999',
      suggestedCreditCardId: null,
      suggestedCreditCardName: null,
      rows: [
        {
          lineNumber: 70,
          externalRef: 'ref-sem-cartao',
          ordinal: 0,
          date: '2026-07-24',
          description: 'CP PARC SHOPPING INTER (Parcela 01 de 10)',
          amount: '336.81',
          installmentNumber: 1,
          totalInstallments: 10,
          suggestedCategoryId: null,
          suggestedCategoryName: null,
          duplicate: false,
        },
      ],
    },
  ],
}

let lastFaturaCommit: FaturaImportCommitRequest | null = null

export function getLastFaturaCommit() {
  return lastFaturaCommit
}

export function resetFaturaImportStore() {
  lastFaturaCommit = null
}

let cardsStore: Card[] = [MOCK_CARD_1, MOCK_CARD_2]

export function resetCardsStore() {
  cardsStore = [MOCK_CARD_1, MOCK_CARD_2]
}

export const cardsHandlers = [
  // A prévia não tem handler: o XHR do jsdom trava num POST multipart com arquivo, então
  // os testes de tela mockam `previewFaturaImport` e usam MOCK_FATURA_PREVIEW. A
  // confirmação é JSON e passa por aqui normalmente. Precisa vir antes de
  // `*/cards/:id`, senão "invoices" seria capturado como um id.
  http.post('*/cards/invoices/import', async ({ request }) => {
    const body = (await request.json()) as FaturaImportCommitRequest
    lastFaturaCommit = body
    return HttpResponse.json(
      {
        imported: body.rows.length,
        futureInstallments: 0,
        skippedDuplicates: 0,
        failed: 0,
        markedPaidInvoices: body.alreadyPaid ? 1 : 0,
        errors: [],
      },
      { status: 201 },
    )
  }),

  http.get('*/cards', () => {
    return HttpResponse.json(cardsStore)
  }),

  http.get('*/cards/:id/invoices/:referenceMonth', ({ params }) => {
    if (params.id === 'card-1') {
      return HttpResponse.json({ ...MOCK_INVOICE, referenceMonth: params.referenceMonth as string })
    }
    return HttpResponse.json(
      { errorCode: 'INVOICE_NOT_FOUND', message: 'Invoice not found.', correlationId: 'test-id' },
      { status: 404 },
    )
  }),

  http.get('*/cards/:id/limit', ({ params }) => {
    if (params.id === 'card-1') return HttpResponse.json(MOCK_LIMIT_USAGE)
    return HttpResponse.json({
      creditLimit: '10000.00',
      usedLimit: '0.00',
      availableLimit: '10000.00',
    })
  }),

  http.get('*/cards/:id/spending', ({ params }) => {
    if (params.id === 'card-1') return HttpResponse.json(MOCK_SPENDING)
    return HttpResponse.json([])
  }),

  http.delete('*/cards/:id', ({ params }) => {
    cardsStore = cardsStore.filter((c) => c.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/cards/:id', ({ params }) => {
    const card = cardsStore.find((c) => c.id === params.id)
    if (!card) {
      return HttpResponse.json(
        { errorCode: 'CARD_NOT_FOUND', message: 'Card not found.', correlationId: 'test-id' },
        { status: 404 },
      )
    }
    return HttpResponse.json(card)
  }),

  http.post('*/cards', async ({ request }) => {
    const body = (await request.json()) as Omit<Card, 'id' | 'archivedAt' | 'createdAt'>
    const created: Card = {
      id: `card-${Date.now()}`,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      ...body,
    }
    cardsStore = [...cardsStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/cards/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Card>
    cardsStore = cardsStore.map((c) => (c.id === params.id ? { ...c, ...body } : c))
    const updated = cardsStore.find((c) => c.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.post('*/cards/:id/archive', ({ params }) => {
    cardsStore = cardsStore.map((c) =>
      c.id === params.id ? { ...c, archivedAt: new Date().toISOString() } : c,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/cards/invoices/:invoiceId/pay', async () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

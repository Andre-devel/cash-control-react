import { http, HttpResponse } from 'msw'
import type { Card, Invoice, LimitUsage, SpendingItem } from '@/features/cards/types'

export const MOCK_CARD_1: Card = {
  id: 'card-1',
  name: 'Nubank',
  brand: 'VISA',
  issuer: 'Nu Pagamentos S.A.',
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

let cardsStore: Card[] = [MOCK_CARD_1, MOCK_CARD_2]

export function resetCardsStore() {
  cardsStore = [MOCK_CARD_1, MOCK_CARD_2]
}

export const cardsHandlers = [
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

  http.post('*/cards/:id/charges', async () => {
    return new HttpResponse(null, { status: 201 })
  }),

  http.post('*/cards/invoices/:invoiceId/pay', async () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

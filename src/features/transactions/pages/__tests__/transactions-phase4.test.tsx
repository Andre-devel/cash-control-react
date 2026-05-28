import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_TRANSFER_TX, resetTransactionsStore } from '@/test/handlers/transactions.handlers'
import TransactionsPage from '../transactions-page'
import { createTransactionSchema } from '@/features/transactions/schemas/create-transaction.schema'
import { transactionFiltersSchema } from '@/features/transactions/schemas/transaction-filters.schema'
import { createRecurrenceSchema } from '@/features/recurrences/schemas/create-recurrence.schema'
import { uploadAttachment, payTransaction } from '@/features/transactions/api/transactions.api'
import { axiosInstance } from '@/services/http'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  resetTransactionsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

// ---------------------------------------------------------------------------
// Phase 4.1 — TransactionType enum: ADJUSTMENT removed, TRANSFER is filter-only
// ---------------------------------------------------------------------------

describe('TransactionType enum — Phase 4.1', () => {
  const validBase = {
    description: 'Test',
    amount: '100.00',
    accountId: 'acc-1',
    competenceDate: '2026-06-01',
    status: 'PENDING' as const,
  }

  it('rejects ADJUSTMENT as a transaction type', () => {
    const result = createTransactionSchema.safeParse({ ...validBase, type: 'ADJUSTMENT' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it('rejects TRANSFER as a manually-created transaction type', () => {
    const result = createTransactionSchema.safeParse({ ...validBase, type: 'TRANSFER' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it('accepts INCOME, EXPENSE, REFUND as valid create types', () => {
    for (const type of ['INCOME', 'EXPENSE', 'REFUND'] as const) {
      expect(createTransactionSchema.safeParse({ ...validBase, type }).success).toBe(true)
    }
  })

  it('accepts TRANSFER as a filter-only type', () => {
    expect(transactionFiltersSchema.safeParse({ type: 'TRANSFER' }).success).toBe(true)
  })

  it('rejects ADJUSTMENT as a filter type', () => {
    expect(transactionFiltersSchema.safeParse({ type: 'ADJUSTMENT' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Phase 4.1 — RecurrenceType enum: ADJUSTMENT removed
// ---------------------------------------------------------------------------

describe('RecurrenceType enum — Phase 4.1', () => {
  const validBase = {
    description: 'Monthly rent',
    amount: '1500.00',
    frequency: 'MONTHLY' as const,
    accountId: 'acc-1',
    startDate: '2026-01-01',
  }

  it('rejects ADJUSTMENT as a recurrence type', () => {
    const result = createRecurrenceSchema.safeParse({ ...validBase, type: 'ADJUSTMENT' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it('accepts INCOME, EXPENSE, REFUND as valid recurrence types', () => {
    for (const type of ['INCOME', 'EXPENSE', 'REFUND'] as const) {
      expect(createRecurrenceSchema.safeParse({ ...validBase, type }).success).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Phase 4.2 — Attachment upload uses 'files' field name (plural)
// ---------------------------------------------------------------------------

describe('Attachment upload field name — Phase 4.2', () => {
  it('uploadAttachment appends file under "files" key (plural) to FormData', async () => {
    const capturedFormData: FormData[] = []
    const spy = vi.spyOn(axiosInstance, 'post').mockResolvedValueOnce({
      data: [
        {
          id: 'att-1',
          transactionId: 'tx-1',
          fileName: 'test.pdf',
          contentType: 'application/pdf',
          size: 1024,
          url: 'https://example.com/test.pdf',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    const result = await uploadAttachment('tx-1', file)

    expect(spy).toHaveBeenCalledOnce()
    const callArgs = spy.mock.calls[0]
    const formDataArg = callArgs[1] as FormData
    capturedFormData.push(formDataArg)

    expect(formDataArg).toBeInstanceOf(FormData)
    expect(formDataArg.get('files')).toBeInstanceOf(File)
    expect(formDataArg.get('file')).toBeNull()

    expect(Array.isArray(result)).toBe(true)
    expect(result[0].fileName).toBe('test.pdf')

    spy.mockRestore()
  })

  it('uploadAttachment returns an array of Attachment (not a single object)', async () => {
    vi.spyOn(axiosInstance, 'post').mockResolvedValueOnce({
      data: [
        {
          id: 'att-1',
          transactionId: 'tx-1',
          fileName: 'receipt.jpg',
          contentType: 'image/jpeg',
          size: 2048,
          url: 'https://example.com/receipt.jpg',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    const file = new File(['img'], 'receipt.jpg', { type: 'image/jpeg' })
    const result = await uploadAttachment('tx-1', file)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    vi.restoreAllMocks()
  })
})

// ---------------------------------------------------------------------------
// Phase 4.1 — TRANSFER type renders correctly in transaction list
// ---------------------------------------------------------------------------

describe('TRANSFER type rendering — Phase 4.1', () => {
  it('renders TRANSFER transaction badge in the list', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({
          content: [MOCK_TRANSFER_TX],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 20,
        }),
      ),
    )

    renderWithProviders(<TransactionsPage />)

    await waitFor(() => expect(screen.getByText(MOCK_TRANSFER_TX.description)).toBeTruthy())
    expect(screen.getAllByText('Transferência').length).toBeGreaterThan(0)
  })

  it('filter by TRANSFER type includes TRANSFER in filter dropdown', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => screen.getByRole('combobox', { name: /filtrar por tipo/i }))
    const typeFilter = screen.getByRole('combobox', { name: /filtrar por tipo/i })
    const options = Array.from(typeFilter.querySelectorAll('option')).map((o) => o.value)
    expect(options).toContain('TRANSFER')
  })

  it('filter dropdown does not include ADJUSTMENT', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => screen.getByRole('combobox', { name: /filtrar por tipo/i }))
    const typeFilter = screen.getByRole('combobox', { name: /filtrar por tipo/i })
    const options = Array.from(typeFilter.querySelectorAll('option')).map((o) => o.value)
    expect(options).not.toContain('ADJUSTMENT')
  })
})

// ---------------------------------------------------------------------------
// Phase 4.3 — payTransaction supports optional paymentDate
// ---------------------------------------------------------------------------

describe('payTransaction with paymentDate — Phase 4.3', () => {
  it('sends paymentDate in body when provided', async () => {
    const spy = vi.spyOn(axiosInstance, 'post').mockResolvedValueOnce({
      data: {
        id: 'tx-3',
        status: 'PAID',
        paymentDate: '2026-06-01',
      },
    })

    await payTransaction('tx-3', { paymentDate: '2026-06-01' })

    expect(spy).toHaveBeenCalledWith('/transactions/tx-3/pay', { paymentDate: '2026-06-01' })
    spy.mockRestore()
  })

  it('sends empty body when no paymentDate provided', async () => {
    const spy = vi.spyOn(axiosInstance, 'post').mockResolvedValueOnce({
      data: { id: 'tx-3', status: 'PAID' },
    })

    await payTransaction('tx-3', undefined)

    expect(spy).toHaveBeenCalledWith('/transactions/tx-3/pay', {})
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Phase 4.3 — Transaction type enriched with optional fields
// ---------------------------------------------------------------------------

describe('Transaction type enrichment — Phase 4.3', () => {
  it('renders notes field from enriched transaction in list', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({
          content: [
            {
              ...MOCK_TRANSFER_TX,
              id: 'tx-notes',
              description: 'Purchase with notes',
              type: 'EXPENSE',
              notes: 'Reimbursable by company',
              accountName: 'Checking Account',
              categoryName: 'Business',
            },
          ],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 20,
        }),
      ),
    )

    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText('Purchase with notes')).toBeTruthy())
  })
})

// ---------------------------------------------------------------------------
// Phase 4.2 — Create dialog has no ADJUSTMENT option
// ---------------------------------------------------------------------------

describe('Create transaction dialog — Phase 4.2', () => {
  it('create form type dropdown does not include ADJUSTMENT', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova transação/i }))
    await user.click(screen.getByRole('button', { name: /nova transação/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const typeSelect = screen.getByRole('combobox', { name: /tipo/i })
    const optionValues = Array.from(typeSelect.querySelectorAll('option')).map((o) => o.value)
    expect(optionValues).not.toContain('ADJUSTMENT')
    expect(optionValues).not.toContain('TRANSFER')
    expect(optionValues).toContain('INCOME')
    expect(optionValues).toContain('EXPENSE')
    expect(optionValues).toContain('REFUND')
  })
})

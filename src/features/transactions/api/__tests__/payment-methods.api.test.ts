import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { listPaymentMethods } from '../payment-methods.api'
import {
  MOCK_PAYMENT_METHODS,
  MOCK_PAYMENT_METHOD_OTHER,
} from '@/test/handlers/payment-methods.handlers'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'

beforeEach(() => {
  server.resetHandlers()
})

describe('listPaymentMethods', () => {
  it('returns the full list of seven payment methods', async () => {
    const result = await listPaymentMethods()
    expect(result).toHaveLength(7)
  })

  it('returns objects with id, slug, and name fields', async () => {
    const result = await listPaymentMethods()
    for (const pm of result) {
      expect(pm).toHaveProperty('id')
      expect(pm).toHaveProperty('slug')
      expect(pm).toHaveProperty('name')
    }
  })

  it('returns all seven canonical slugs', async () => {
    const result = await listPaymentMethods()
    const slugs = result.map((pm) => pm.slug)
    for (const slug of PAYMENT_METHOD_SLUGS) {
      expect(slugs).toContain(slug)
    }
  })

  it('matches the mock payment methods data', async () => {
    const result = await listPaymentMethods()
    expect(result).toEqual(MOCK_PAYMENT_METHODS)
  })

  it('rejects when the API returns a 500 error', async () => {
    server.use(
      http.get('*/payment-methods', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    await expect(listPaymentMethods()).rejects.toBeDefined()
  })

  it('MOCK_PAYMENT_METHOD_OTHER has slug OTHER', () => {
    expect(MOCK_PAYMENT_METHOD_OTHER.slug).toBe('OTHER')
  })

  it('PAYMENT_METHOD_SLUGS contains exactly the seven expected slugs', () => {
    expect(PAYMENT_METHOD_SLUGS).toHaveLength(7)
    expect(PAYMENT_METHOD_SLUGS).toContain('CASH')
    expect(PAYMENT_METHOD_SLUGS).toContain('PIX')
    expect(PAYMENT_METHOD_SLUGS).toContain('DEBIT_CARD')
    expect(PAYMENT_METHOD_SLUGS).toContain('CREDIT_CARD')
    expect(PAYMENT_METHOD_SLUGS).toContain('BANK_TRANSFER')
    expect(PAYMENT_METHOD_SLUGS).toContain('BOLETO')
    expect(PAYMENT_METHOD_SLUGS).toContain('OTHER')
  })
})

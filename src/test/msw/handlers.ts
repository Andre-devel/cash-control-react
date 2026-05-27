import { http, HttpResponse } from 'msw'
import { rolesHandlers } from '@/test/handlers/roles.handlers'
import { accountsHandlers } from '@/test/handlers/accounts.handlers'
import { categoriesHandlers } from '@/test/handlers/categories.handlers'
import { transactionsHandlers } from '@/test/handlers/transactions.handlers'
import type { UserProfile, ConsentRecord } from '@/features/profile/types'

function makeTestToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['USER'],
      exp: 9_999_999_999,
      iat: 1_234_567_890,
    }),
  ).toString('base64')
  return `${header}.${payload}.mock-signature`
}

export const MOCK_TOKEN = makeTestToken()

export const MOCK_PROFILE: UserProfile = {
  id: 'user-123',
  name: 'Test User',
  email: 'user@example.com',
  preferences: {},
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_CONSENTS: ConsentRecord[] = [
  {
    id: 'consent-1',
    type: 'TERMS_OF_SERVICE',
    status: 'ACCEPTED',
    date: '2026-01-01T00:00:00Z',
  },
  {
    id: 'consent-2',
    type: 'PRIVACY_POLICY',
    status: 'ACCEPTED',
    date: '2026-01-01T00:00:00Z',
  },
]

export const profileHandlers = [
  http.get('*/users/me', () => {
    return HttpResponse.json(MOCK_PROFILE)
  }),

  http.put('*/users/me', async ({ request }) => {
    const body = (await request.json()) as { name: string }
    return HttpResponse.json({ ...MOCK_PROFILE, name: body.name })
  }),

  http.get('*/users/me/consents', () => {
    return HttpResponse.json(MOCK_CONSENTS)
  }),
]

export const handlers = [
  ...rolesHandlers,
  ...profileHandlers,
  ...accountsHandlers,
  ...categoriesHandlers,
  ...transactionsHandlers,

  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'user@example.com' && body.password === 'password123') {
      return HttpResponse.json({ token: MOCK_TOKEN })
    }

    return HttpResponse.json(
      {
        errorCode: 'INVALID_CREDENTIALS',
        message: 'An unexpected error occurred.',
        correlationId: 'test-correlation-id',
      },
      { status: 401 },
    )
  }),

  http.post('*/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string }

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        {
          errorCode: 'EMAIL_ALREADY_IN_USE',
          message: 'An unexpected error occurred.',
          correlationId: 'test-correlation-id',
        },
        { status: 409 },
      )
    }

    return HttpResponse.json({}, { status: 201 })
  }),
]

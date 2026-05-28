import { http, HttpResponse } from 'msw'
import { rolesHandlers } from '@/test/handlers/roles.handlers'
import { accountsHandlers } from '@/test/handlers/accounts.handlers'
import { categoriesHandlers } from '@/test/handlers/categories.handlers'
import { transactionsHandlers } from '@/test/handlers/transactions.handlers'
import { installmentsHandlers } from '@/test/handlers/installments.handlers'
import { recurrencesHandlers } from '@/test/handlers/recurrences.handlers'
import { cardsHandlers } from '@/test/handlers/cards.handlers'
import { dashboardHandlers } from '@/test/handlers/dashboard.handlers'
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
  ...installmentsHandlers,
  ...recurrencesHandlers,
  ...cardsHandlers,
  ...dashboardHandlers,

  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'user@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: MOCK_TOKEN,
        tokenType: 'Bearer',
        expiresInSeconds: 900,
      })
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

  http.post('*/auth/logout', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/auth/me', () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      status: 'ACTIVE',
      roles: ['USER'],
      permissions: [],
      linkedProviders: [],
      createdAt: '2026-01-01T00:00:00Z',
    })
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

    return HttpResponse.json(
      { message: 'Registration successful. Please verify your email.' },
      { status: 201 },
    )
  }),

  http.get('*/auth/email/verify', ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    if (token === 'expired-token') {
      return HttpResponse.json(
        {
          errorCode: 'TOKEN_EXPIRED',
          message: 'Verification token expired.',
          correlationId: 'test-id',
        },
        { status: 400 },
      )
    }
    return HttpResponse.json({ message: 'Email verified successfully.' })
  }),

  http.post('*/auth/email/verify/resend', () => {
    return HttpResponse.json({ message: 'If that email is registered, a link has been sent.' })
  }),

  http.post('*/auth/password-reset/request', () => {
    return HttpResponse.json({
      message: 'If that email is registered, a reset link has been sent.',
    })
  }),

  http.post('*/auth/password-reset/confirm', async ({ request }) => {
    const body = (await request.json()) as { token: string; newPassword: string }
    if (body.token === 'expired-token') {
      return HttpResponse.json(
        { errorCode: 'TOKEN_EXPIRED', message: 'Reset token expired.', correlationId: 'test-id' },
        { status: 400 },
      )
    }
    return HttpResponse.json({ message: 'Password reset successfully.' })
  }),

  http.post('*/auth/password/change', async ({ request }) => {
    const body = (await request.json()) as { currentPassword: string; newPassword: string }
    if (body.currentPassword === 'wrongpassword') {
      return HttpResponse.json(
        {
          errorCode: 'WRONG_CURRENT_PASSWORD',
          message: 'Current password is incorrect.',
          correlationId: 'test-id',
        },
        { status: 400 },
      )
    }
    return new HttpResponse(null, { status: 204 })
  }),
]

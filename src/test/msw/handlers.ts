import { http, HttpResponse } from 'msw'
import { rolesHandlers } from '@/test/handlers/roles.handlers'

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

export const handlers = [
  ...rolesHandlers,

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

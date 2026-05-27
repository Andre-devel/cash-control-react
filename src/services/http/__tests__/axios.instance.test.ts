import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosError } from 'axios'
import { normalizeError } from '../axios.instance'

// Mock the dynamic imports used inside handle401 so the interceptor tests
// stay synchronous and isolated.
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      token: null,
      clearSession: vi.fn(),
    })),
  },
}))

vi.mock('@/app/providers/query-provider', () => ({
  queryClient: { clear: vi.fn() },
}))

vi.mock('@/app/router/router', () => ({
  router: { navigate: vi.fn() },
}))

vi.mock('@/lib/toast', () => ({
  toast: { warn: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    SESSION_RESTORED: 'SESSION_RESTORED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT: 'UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT',
    FORBIDDEN_ROUTE_ACCESS_ATTEMPT: 'FORBIDDEN_ROUTE_ACCESS_ATTEMPT',
  },
}))

function makeAxiosError(overrides: Partial<AxiosError> = {}): AxiosError {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    response: undefined,
    config: { url: '/test-path' },
    ...overrides,
  } as unknown as AxiosError
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('normalizeError', () => {
  it('extracts status, errorCode, message, and correlationId from response', () => {
    const error = makeAxiosError({
      response: {
        status: 400,
        data: {
          errorCode: 'VALIDATION_ERROR',
          message: 'Invalid input',
          correlationId: 'abc-123',
        },
      } as unknown as AxiosError['response'],
    })

    const result = normalizeError(error)

    expect(result.status).toBe(400)
    expect(result.errorCode).toBe('VALIDATION_ERROR')
    expect(result.message).toBe('Invalid input')
    expect(result.correlationId).toBe('abc-123')
    expect(result.path).toBe('/test-path')
  })

  it('falls back to UNKNOWN_ERROR when errorCode is missing', () => {
    const error = makeAxiosError({
      response: {
        status: 500,
        data: {},
      } as unknown as AxiosError['response'],
    })

    const result = normalizeError(error)

    expect(result.errorCode).toBe('UNKNOWN_ERROR')
    expect(result.status).toBe(500)
  })

  it('generates a correlationId when none is provided', () => {
    const error = makeAxiosError({
      response: {
        status: 500,
        data: { errorCode: 'SERVER_ERROR', message: 'Server failed' },
      } as unknown as AxiosError['response'],
    })

    const result = normalizeError(error)

    expect(result.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('produces status 0 for network errors with no response', () => {
    const error = makeAxiosError({ response: undefined })
    const result = normalizeError(error)
    expect(result.status).toBe(0)
  })

  it('does not include the token in the normalized error output', () => {
    const error = makeAxiosError({
      response: {
        status: 401,
        data: {
          errorCode: 'UNAUTHORIZED',
          message: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret should not appear',
        },
      } as unknown as AxiosError['response'],
    })

    const result = normalizeError(error)
    const serialized = JSON.stringify(result)

    // The token field itself must never appear in normalized output
    expect(serialized).not.toContain('"token"')
  })

  it('falls back to empty string path when config url is absent', () => {
    const error = makeAxiosError({ config: undefined })
    const result = normalizeError(error)
    expect(result.path).toBe('')
  })
})

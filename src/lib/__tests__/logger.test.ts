import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { logger, LOG_EVENTS } from '../logger'

let consoleSpy: MockInstance

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function getParsedOutput(): Record<string, unknown> {
  return JSON.parse(consoleSpy.mock.calls[0][0] as string) as Record<string, unknown>
}

describe('logger', () => {
  it('outputs valid JSON with timestamp, event, and correlationId', () => {
    logger.log({ event: LOG_EVENTS.LOGIN_SUCCESS, correlationId: 'test-id' })

    const output = getParsedOutput()
    expect(output.event).toBe('LOGIN_SUCCESS')
    expect(output.correlationId).toBe('test-id')
    expect(typeof output.timestamp).toBe('string')
    expect(output.timestamp as string).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('strips the token field from log output', () => {
    logger.log({ event: LOG_EVENTS.LOGIN_FAILURE, token: 'secret-jwt' })

    const output = getParsedOutput()
    expect(output).not.toHaveProperty('token')
  })

  it('strips the password field from log output', () => {
    logger.log({ event: LOG_EVENTS.LOGIN_FAILURE, password: 'secret' })

    const output = getParsedOutput()
    expect(output).not.toHaveProperty('password')
  })

  it('strips the confirmPassword field from log output', () => {
    logger.log({ event: LOG_EVENTS.LOGIN_FAILURE, confirmPassword: 'secret' })

    const output = getParsedOutput()
    expect(output).not.toHaveProperty('confirmPassword')
  })

  it('strips the authorization field from log output', () => {
    logger.log({ event: LOG_EVENTS.SESSION_EXPIRED, authorization: 'Bearer token' })

    const output = getParsedOutput()
    expect(output).not.toHaveProperty('authorization')
  })

  it('generates a correlationId when none is provided', () => {
    logger.log({ event: LOG_EVENTS.LOGOUT })

    const output = getParsedOutput()
    expect(typeof output.correlationId).toBe('string')
    expect((output.correlationId as string).length).toBeGreaterThan(0)
  })

  it('includes non-sensitive extra fields in the output', () => {
    logger.log({ event: LOG_EVENTS.SESSION_EXPIRED, path: '/dashboard', status: 401 })

    const output = getParsedOutput()
    expect(output.path).toBe('/dashboard')
    expect(output.status).toBe(401)
  })

  it('logs all defined event types without error', () => {
    for (const event of Object.values(LOG_EVENTS)) {
      expect(() => logger.log({ event })).not.toThrow()
    }
  })
})

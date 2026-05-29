import { describe, it, expect, vi } from 'vitest'
import { setFormErrors } from '../form-errors'
import type { NormalizedError } from '@/features/auth/types'

function makeError(overrides: Partial<NormalizedError> = {}): NormalizedError {
  return {
    status: 400,
    errorCode: 'VALIDATION_ERROR',
    message: 'Validation failed.',
    correlationId: 'test-corr-id',
    ...overrides,
  }
}

describe('setFormErrors', () => {
  it('calls setError for each field in fieldErrors', () => {
    const setError = vi.fn()
    const error = makeError({
      fieldErrors: {
        name: 'Name already exists',
        amount: 'Must be positive',
      },
    })

    setFormErrors(error, setError)

    expect(setError).toHaveBeenCalledTimes(2)
    expect(setError).toHaveBeenCalledWith('name', {
      type: 'server',
      message: 'Name already exists',
    })
    expect(setError).toHaveBeenCalledWith('amount', { type: 'server', message: 'Must be positive' })
  })

  it('sets root error when no fieldErrors present', () => {
    const setError = vi.fn()
    const error = makeError({ message: 'An account with this name already exists.' })

    setFormErrors(error, setError)

    expect(setError).toHaveBeenCalledTimes(1)
    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'An account with this name already exists.',
    })
  })

  it('sets root error when fieldErrors is an empty object', () => {
    const setError = vi.fn()
    const error = makeError({ fieldErrors: {} })

    setFormErrors(error, setError)

    expect(setError).toHaveBeenCalledTimes(1)
    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'Validation failed.',
    })
  })

  it('sets root error when fieldErrors is undefined', () => {
    const setError = vi.fn()
    const error = makeError({ fieldErrors: undefined })

    setFormErrors(error, setError)

    expect(setError).toHaveBeenCalledWith('root', {
      type: 'server',
      message: 'Validation failed.',
    })
  })
})

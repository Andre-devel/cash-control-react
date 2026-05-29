import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from '../toast'
import { toast as sonnerToast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toast', () => {
  it('calls sonner toast.success with the message', () => {
    toast.success('Done!')
    expect(sonnerToast.success).toHaveBeenCalledWith('Done!')
  })

  it('calls sonner toast.error with the message only when no correlationId', () => {
    toast.error('Failed!')
    expect(sonnerToast.error).toHaveBeenCalledWith('Failed!')
  })

  it('calls sonner toast.error with description when correlationId is provided', () => {
    toast.error('Internal error.', 'abc-123')
    expect(sonnerToast.error).toHaveBeenCalledWith('Internal error.', {
      description: 'Ref: abc-123',
    })
  })

  it('calls sonner toast.warning via toast.warn without correlationId', () => {
    toast.warn('Careful!')
    expect(sonnerToast.warning).toHaveBeenCalledWith('Careful!')
  })

  it('calls sonner toast.warning via toast.warn with correlationId', () => {
    toast.warn('Session expired.', 'session-ref-456')
    expect(sonnerToast.warning).toHaveBeenCalledWith('Session expired.', {
      description: 'Ref: session-ref-456',
    })
  })

  it('calls sonner toast.info with the message', () => {
    toast.info('Note!')
    expect(sonnerToast.info).toHaveBeenCalledWith('Note!')
  })
})

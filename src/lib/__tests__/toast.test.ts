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

  it('calls sonner toast.error with the message', () => {
    toast.error('Failed!')
    expect(sonnerToast.error).toHaveBeenCalledWith('Failed!')
  })

  it('calls sonner toast.warning via toast.warn', () => {
    toast.warn('Careful!')
    expect(sonnerToast.warning).toHaveBeenCalledWith('Careful!')
  })

  it('calls sonner toast.info with the message', () => {
    toast.info('Note!')
    expect(sonnerToast.info).toHaveBeenCalledWith('Note!')
  })
})

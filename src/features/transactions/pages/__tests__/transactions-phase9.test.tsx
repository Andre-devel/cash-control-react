import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { resetTransactionsStore } from '@/test/handlers/transactions.handlers'
import { AttachmentSection } from '@/features/transactions/components/attachment-section'
import { axiosInstance } from '@/services/http'
import type { NormalizedError } from '@/features/auth/types'

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
// Phase 9.2 — Attachment upload integration (regression guard for "files" field)
//
// Two-level strategy:
//   1. Unit (transactions-phase4.test.tsx): uploadAttachment() calls axiosInstance.post
//      with FormData whose "files" key is a File and "file" key is null.
//   2. Component integration (this file): AttachmentSection renders and triggers the
//      full component → useUploadAttachment → uploadAttachment → HTTP pipeline,
//      verifying success path, the "files" field name, and the error path.
//
// Note: request.formData() cannot be used in MSW handlers here because Axios omits
// the multipart boundary when Content-Type is explicitly set in JSDOM. Therefore the
// POST/error tests use axiosInstance.post spies (which are module-isolated per test
// file in Vitest's thread pool) instead of server.use() overrides.
// ---------------------------------------------------------------------------

describe('Attachment upload — Phase 9.2 integration regression guard', () => {
  it('full pipeline: component triggers upload, "files" field sent, success toast shown', async () => {
    const spy = vi.spyOn(axiosInstance, 'post').mockResolvedValueOnce({
      data: [
        {
          id: 'att-new',
          transactionId: 'tx-1',
          fileName: 'invoice.pdf',
          contentType: 'application/pdf',
          size: 1024,
          url: 'https://example.com/uploads/invoice.pdf',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()

    renderWithProviders(<AttachmentSection transactionId="tx-1" />)

    // Wait for the initial GET /transactions/:id/attachments to resolve
    await waitFor(() => expect(screen.queryByLabelText('Loading attachments')).toBeNull())

    const fileInput = screen.getByLabelText('Upload attachment')
    const file = new File(['receipt content'], 'invoice.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)

    // Verify the hook called axiosInstance.post with the correct URL
    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect(spy).toHaveBeenCalledWith(
      '/transactions/tx-1/attachments',
      expect.any(FormData),
      expect.any(Object),
    )

    // Regression guard: FormData must use "files" (plural), not "file" (singular)
    const formDataArg = spy.mock.calls[0][1] as FormData
    expect(formDataArg.get('files')).toBeInstanceOf(File)
    expect(formDataArg.get('file')).toBeNull()

    // Success toast confirms mutation onSuccess ran
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Attachment uploaded.')
    })
    expect(toast.error).not.toHaveBeenCalled()

    spy.mockRestore()
  })

  it('attachment list shows default handler file name after upload without server.use()', async () => {
    // Uses the default MSW handler (no server.use() to avoid shared-interceptor
    // flakiness with other test files). After upload, invalidateQueries refetches
    // GET /transactions/tx-1/attachments which returns the updated attachmentsStore.
    // The default POST handler adds a new Attachment with fileName: 'uploaded-file.pdf'.
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()

    renderWithProviders(<AttachmentSection transactionId="tx-1" />)

    // Initial load: MOCK_ATTACHMENT_1 (receipt.pdf) for tx-1 from the reset store
    await waitFor(() => expect(screen.getByText('receipt.pdf')).toBeTruthy())

    const fileInput = screen.getByLabelText('Upload attachment')
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Attachment uploaded.')
    })

    // After invalidation the list refetches; default handler returns store contents
    // which now include the newly created entry (fileName: 'uploaded-file.pdf')
    await waitFor(() => {
      expect(screen.getByText('uploaded-file.pdf')).toBeTruthy()
    })
  })

  it('upload error shows error toast (no success toast) when API rejects', async () => {
    // Simulate a 422 rejection at the axiosInstance level to avoid the multipart
    // boundary issue with MSW+JSDOM for error-path testing.
    const errorPayload: NormalizedError = {
      status: 422,
      errorCode: 'FILE_TOO_LARGE',
      message: 'File exceeds maximum allowed size.',
      correlationId: 'test-corr',
      path: '/transactions/tx-1/attachments',
    }
    const spy = vi.spyOn(axiosInstance, 'post').mockRejectedValueOnce(errorPayload)

    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()

    renderWithProviders(<AttachmentSection transactionId="tx-1" />)
    await waitFor(() => expect(screen.queryByLabelText('Loading attachments')).toBeNull())

    const fileInput = screen.getByLabelText('Upload attachment')
    const file = new File(['content'], 'large.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
    expect(toast.success).not.toHaveBeenCalled()

    spy.mockRestore()
  })
})

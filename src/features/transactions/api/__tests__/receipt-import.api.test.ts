import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AxiosAdapter, AxiosDefaults, InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/services/http'
import { previewReceipt, commitReceipt } from '@/features/transactions/api/receipt-import.api'
import type { ReceiptCommitRequest } from '@/features/transactions/types'

/**
 * Mesmo motivo do teste irmão em `statement-import.api.test.ts`: captura o request no
 * ponto em que o axios já aplicou `transformRequest` — onde o bug de multipart aconteceria
 * — em vez de deixar o jsdom tentar de fato enviar um POST com FormData.
 */
let captured: InternalAxiosRequestConfig[] = []
let originalAdapter: AxiosDefaults['adapter']

function captureRequests() {
  captured = []
  originalAdapter = axiosInstance.defaults.adapter
  axiosInstance.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
    captured.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }) as AxiosAdapter
}

describe('receipt-import.api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    captureRequests()
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
  })

  it('keeps the preview body as FormData instead of letting axios turn it into JSON', async () => {
    const file = new File(['%PDF-1.4'], 'comprovante.pdf', { type: 'application/pdf' })

    await previewReceipt(file)

    const request = captured[0]
    expect(request.data).toBeInstanceOf(FormData)
    expect((request.data as FormData).get('file')).toBe(file)
    expect(request.headers.getContentType() ?? '').not.toContain('application/json')
  })

  it('sends accountId as a query param only when provided', async () => {
    const file = new File(['%PDF-1.4'], 'comprovante.pdf', { type: 'application/pdf' })

    await previewReceipt(file, 'account-1')
    expect(captured[0].url).toBe('/transactions/receipts/preview')
    expect(captured[0].params).toEqual({ accountId: 'account-1' })

    await previewReceipt(file)
    expect(captured[1].params).toBeUndefined()
  })

  it('posts both the reviewed data and the file as multipart parts on commit', async () => {
    const file = new File(['%PDF-1.4'], 'comprovante.pdf', { type: 'application/pdf' })
    const data: ReceiptCommitRequest = {
      accountId: 'account-1',
      externalRef: 'E12345678202608151030abcdef12345',
      type: 'EXPENSE',
      amount: '150.00',
      description: 'Padaria São João',
      originalDescription: 'Padaria São João',
      competenceDate: '2026-08-15',
    }

    await commitReceipt(data, file)

    const request = captured[0]
    expect(request.url).toBe('/transactions/receipts')
    expect(request.data).toBeInstanceOf(FormData)
    const formData = request.data as FormData
    expect(formData.get('file')).toBe(file)
    const dataPart = formData.get('data') as Blob
    expect(dataPart).toBeInstanceOf(Blob)
    expect(dataPart.type).toBe('application/json')
    const text: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(dataPart)
    })
    expect(text).toBe(JSON.stringify(data))
    expect(request.headers.getContentType() ?? '').not.toContain('application/json')
  })
})

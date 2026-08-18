import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AxiosAdapter, AxiosDefaults, InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/services/http'
import { previewFaturaImport, commitFaturaImport } from '@/features/cards/api/fatura-import.api'

/**
 * Captura o request no ponto em que o axios já aplicou `transformRequest` — que é
 * onde o bug de multipart acontece — e antes de qualquer I/O. O MSW não serve aqui:
 * o XHR do jsdom trava num POST multipart com arquivo, então um teste por lá não
 * conseguiria distinguir "funcionou" de "travou".
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

function pdfFile() {
  return new File(['%PDF-1.4'], 'fatura-inter-2026-07.pdf', { type: 'application/pdf' })
}

describe('fatura-import.api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    captureRequests()
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
  })

  /**
   * Mesma regressão do import de extrato: a instância do axios define
   * `Content-Type: application/json` por padrão, e o `transformRequest` do axios 1.x
   * converte FormData em JSON quando o Content-Type já é JSON. O upload chegaria ao
   * backend como `{"file":{}}` — sem arquivo — e o Spring responderia 500.
   */
  it('keeps the body as FormData instead of letting axios turn it into JSON', async () => {
    const file = pdfFile()

    await previewFaturaImport(file, 'INTER_FATURA_PDF')

    const request = captured[0]
    expect(request.data).toBeInstanceOf(FormData)
    expect((request.data as FormData).get('file')).toBe(file)
    expect(request.headers.getContentType() ?? '').not.toContain('application/json')
  })

  /** Diferente do extrato, o cartão não vai no preview: ele é resolvido por seção do PDF. */
  it('posts to the preview endpoint with only the format as query param', async () => {
    await previewFaturaImport(pdfFile(), 'INTER_FATURA_PDF')

    expect(captured[0].url).toBe('/cards/invoices/import/preview')
    expect(captured[0].method).toBe('post')
    expect(captured[0].params).toEqual({ format: 'INTER_FATURA_PDF' })
  })

  it('posts the approved rows as JSON on commit', async () => {
    const request = {
      format: 'INTER_FATURA_PDF' as const,
      referenceMonth: '2026-07',
      accountId: 'account-1',
      alreadyPaid: false,
      rows: [
        {
          lineNumber: 59,
          creditCardId: 'card-1',
          cardLast4: '7866',
          externalRef: 'ref-1',
          ordinal: 0,
          date: '2026-04-04',
          description: 'Fone de ouvido',
          originalDescription: 'SHOPEE *LarkSpComercio (Parcela 04 de 05)',
          amount: '55.19',
          installmentNumber: 4,
          totalInstallments: 5,
        },
      ],
    }

    await commitFaturaImport(request)

    expect(captured[0].url).toBe('/cards/invoices/import')
    expect(captured[0].headers.getContentType()).toContain('application/json')
    expect(JSON.parse(captured[0].data as string)).toEqual(request)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AxiosAdapter, AxiosDefaults, InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/services/http'
import {
  previewStatementImport,
  commitStatementImport,
} from '@/features/transactions/api/statement-import.api'

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

describe('statement-import.api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    captureRequests()
  })

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter
  })

  /**
   * Regressão: a instância do axios define `Content-Type: application/json` por padrão, e
   * o `transformRequest` do axios 1.x converte FormData em JSON quando o Content-Type já
   * é JSON. O upload chegava ao backend como `{"file":{}}` — sem arquivo — e o Spring
   * respondia 500 (`HttpMediaTypeNotSupportedException`). Sem zerar o header, este teste
   * volta a falhar.
   */
  it('keeps the body as FormData instead of letting axios turn it into JSON', async () => {
    const file = new File(['Data Lançamento;Histórico'], 'extrato.csv', { type: 'text/csv' })

    await previewStatementImport(file, 'account-1', 'INTER_CSV')

    const request = captured[0]
    expect(request.data).toBeInstanceOf(FormData)
    expect((request.data as FormData).get('file')).toBe(file)
    // `application/json` é exatamente o gatilho da conversão para JSON. Neste ponto o
    // header ainda pode trazer o default de método do axios; o que não pode é ser JSON —
    // o adapter do browser zera o Content-Type para FormData e preenche o boundary.
    expect(request.headers.getContentType() ?? '').not.toContain('application/json')
  })

  it('posts to the preview endpoint with the account and format as query params', async () => {
    const file = new File(['conteudo'], 'extrato.csv', { type: 'text/csv' })

    await previewStatementImport(file, 'account-1', 'INTER_CSV')

    expect(captured[0].url).toBe('/transactions/import/preview')
    expect(captured[0].method).toBe('post')
    expect(captured[0].params).toEqual({ accountId: 'account-1', format: 'INTER_CSV' })
  })

  it('posts the approved rows as JSON on commit', async () => {
    const request = {
      accountId: 'account-1',
      format: 'INTER_CSV' as const,
      rows: [
        {
          lineNumber: 7,
          externalRef: 'ref-1',
          date: '2026-08-04',
          description: 'Pix Marketplace',
          originalDescription: 'Pix Marketplace',
          amount: '144.06',
          type: 'EXPENSE' as const,
          paymentMethod: 'PIX' as const,
        },
      ],
    }

    await commitStatementImport(request)

    expect(captured[0].url).toBe('/transactions/import')
    expect(captured[0].headers.getContentType()).toContain('application/json')
    expect(JSON.parse(captured[0].data as string)).toEqual(request)
  })
})

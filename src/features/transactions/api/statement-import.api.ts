import { axiosInstance } from '@/services/http'
import type {
  ImportCommitRequest,
  ImportPreviewResponse,
  ImportResultResponse,
  StatementFormat,
} from '@/features/transactions/types'

/**
 * Lê o extrato e devolve os lançamentos já classificados, sem gravar nada.
 * A confirmação é um segundo passo, em `commitStatementImport`.
 */
export async function previewStatementImport(
  file: File,
  accountId: string,
  format: StatementFormat,
): Promise<ImportPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)
  // `Content-Type: undefined` é obrigatório, não estilo: a instância do axios define
  // `application/json` por padrão, e o `transformRequest` do axios 1.x serializa
  // FormData para JSON quando o Content-Type já é JSON — o arquivo viraria `{"file":{}}`
  // e o backend responderia 500. Zerando o header, o browser preenche
  // `multipart/form-data` com o boundary correto.
  const response = await axiosInstance.post<ImportPreviewResponse>(
    '/transactions/import/preview',
    formData,
    { params: { accountId, format }, headers: { 'Content-Type': undefined } },
  )
  return response.data
}

export async function commitStatementImport(
  data: ImportCommitRequest,
): Promise<ImportResultResponse> {
  const response = await axiosInstance.post<ImportResultResponse>('/transactions/import', data)
  return response.data
}

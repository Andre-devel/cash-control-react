import { axiosInstance } from '@/services/http'
import type {
  FaturaImportCommitRequest,
  FaturaImportPreviewResponse,
  FaturaImportResultResponse,
  InvoiceImportFormat,
} from '@/features/cards/types'

/**
 * Lê o PDF da fatura e devolve os lançamentos agrupados por seção de cartão, sem
 * gravar nada. A confirmação é um segundo passo, em `commitFaturaImport`.
 */
export async function previewFaturaImport(
  file: File,
  format: InvoiceImportFormat,
): Promise<FaturaImportPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)
  // `Content-Type: undefined` é obrigatório, não estilo: a instância do axios define
  // `application/json` por padrão, e o `transformRequest` do axios 1.x serializa
  // FormData para JSON quando o Content-Type já é JSON — o arquivo viraria `{"file":{}}`
  // e o backend responderia 500. Zerando o header, o browser preenche
  // `multipart/form-data` com o boundary correto.
  const response = await axiosInstance.post<FaturaImportPreviewResponse>(
    '/cards/invoices/import/preview',
    formData,
    { params: { format }, headers: { 'Content-Type': undefined } },
  )
  return response.data
}

export async function commitFaturaImport(
  data: FaturaImportCommitRequest,
): Promise<FaturaImportResultResponse> {
  const response = await axiosInstance.post<FaturaImportResultResponse>(
    '/cards/invoices/import',
    data,
  )
  return response.data
}

import { axiosInstance } from '@/services/http'
import type {
  ReceiptCommitRequest,
  ReceiptPreviewResponse,
  Transaction,
} from '@/features/transactions/types'

/**
 * Lê um comprovante de PIX (PDF ou, com OCR habilitado no servidor, imagem) e devolve o
 * que pôde ser identificado, sem gravar nada. `accountId` é opcional: no fluxo de
 * compartilhamento a conta ainda não foi escolhida quando o comprovante chega.
 */
export async function previewReceipt(
  file: File,
  accountId?: string,
): Promise<ReceiptPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)
  // `Content-Type: undefined` é obrigatório aqui pelo mesmo motivo do upload de anexo e
  // do import de extrato: a instância do axios define `application/json` por padrão, e o
  // `transformRequest` do axios 1.x serializaria o FormData para `{"file":{}}`.
  const response = await axiosInstance.post<ReceiptPreviewResponse>(
    '/transactions/receipts/preview',
    formData,
    { params: accountId ? { accountId } : undefined, headers: { 'Content-Type': undefined } },
  )
  return response.data
}

/**
 * Confirma a transação revisada, anexando o mesmo arquivo enviado à prévia. O backend
 * espera os campos revisados como uma parte JSON (`data`) e o arquivo como outra
 * (`file`) — Spring resolve a parte `data` para `ReceiptCommitRequest` automaticamente
 * pelo Content-Type dela.
 */
export async function commitReceipt(data: ReceiptCommitRequest, file: File): Promise<Transaction> {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  formData.append('file', file)
  const response = await axiosInstance.post<Transaction>('/transactions/receipts', formData, {
    headers: { 'Content-Type': undefined },
  })
  return response.data
}

import type { ImportPreviewRow } from '@/features/transactions/types'

export type BankAccountKind = 'BANK' | 'CREDIT'

export interface BankConnectionAccount {
  id: string
  kind: BankAccountKind
  name: string
  /** Número da conta ou final do cartão, como o banco manda. */
  number: string | null
  accountId: string | null
  creditCardId: string | null
}

export interface BankConnection {
  id: string
  /** Id do item na Pluggy; o widget o recebe em `updateItem` para renovar o consentimento. */
  itemId: string
  connectorName: string | null
  /** Status do item na Pluggy: UPDATED, UPDATING, LOGIN_ERROR, OUTDATED, WAITING_USER_INPUT… */
  status: string
  statusDetail: string | null
  lastSyncedAt: string | null
  accounts: BankConnectionAccount[]
}

export interface BankConnectionsResponse {
  /** Falso quando o servidor não tem credenciais da Pluggy: a seção some. */
  enabled: boolean
  connections: BankConnection[]
}

export interface LinkBankAccountRequest {
  accountId: string | null
  creditCardId: string | null
}

/** Lançamento que o banco avisou e ainda não foi confirmado, classificado como na prévia do import. */
export interface BankPendingItem {
  id: string
  accountId: string
  accountName: string
  row: ImportPreviewRow
}

export interface BankPendingConfirmResponse {
  description: string
  categoryName: string | null
}

export interface BankPendingConfirmAllResponse {
  confirmed: number
  /** Ficaram na fila: possíveis duplicatas e linhas que falharam. */
  skipped: number
}

export interface PushConfig {
  enabled: boolean
  /** Chave VAPID (base64url) com que o navegador se inscreve. */
  publicKey: string | null
}

export interface PushDevice {
  endpoint: string
  deviceLabel: string | null
  hideAmounts: boolean
  /** Recebe o aviso de categoria a 80% e acima de 100% do orçamento. */
  budgetAlerts: boolean
  createdAt: string
}

export interface PushSubscribeRequest {
  endpoint: string
  p256dh: string
  auth: string
  deviceLabel: string
  hideAmounts: boolean
  budgetAlerts: boolean
}

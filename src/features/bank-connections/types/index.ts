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

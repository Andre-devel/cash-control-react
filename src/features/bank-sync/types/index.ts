import type { BankConnectionAccount } from '@/features/bank-connections/types'

export type BankSyncTrigger = 'SCHEDULED' | 'WEBHOOK' | 'MANUAL' | 'REGISTER'

export type BankSyncOutcome = 'SUCCESS' | 'NO_CHANGE' | 'PARTIAL' | 'ERROR' | 'ITEM_GONE'

/** Uma leitura de item da Pluggy: varredura, webhook, "Sincronizar agora" ou cadastro. */
export interface BankSyncRun {
  id: string
  connectionId: string | null
  itemId: string
  connectorName: string | null
  trigger: BankSyncTrigger
  /** Evento do webhook que disparou a leitura (item/updated, transactions/created…). */
  webhookEvent: string | null
  outcome: BankSyncOutcome
  startedAt: string
  finishedAt: string
  itemStatus: string | null
  /** Quando a Pluggy terminou de atualizar com o banco, como lido nesta execução. */
  itemLastUpdatedAt: string | null
  accountsRead: number | null
  transactionsQueued: number | null
  investmentsCreated: number | null
  investmentsRedeemed: number | null
  investmentsFailed: number | null
  /** transactions/created: minutos entre o lançamento chegar na Pluggy e o aviso. */
  webhookDelayMinutes: number | null
  errorMessage: string | null
}

export interface BankSyncRunPage {
  content: BankSyncRun[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface BankSyncRunParams {
  page: number
  size: number
  connectionId?: string
  outcome?: BankSyncOutcome[]
}

export interface BankSyncConnectionSummary {
  connectionId: string
  connectorName: string | null
  itemId: string
  status: string
  statusDetail: string | null
  lastSyncedAt: string | null
  /** Contas que o banco compartilha pela conexão: separam duas conexões do mesmo conector. */
  accounts: BankConnectionAccount[]
  lastRunAt: string | null
  lastRunOutcome: BankSyncOutcome | null
  lastSuccessAt: string | null
  lastProblemAt: string | null
  lastProblemMessage: string | null
  runsLast24h: number
  problemsLast24h: number
  transactionsQueuedLast24h: number
}

export interface BankSyncOverview {
  /** Próxima varredura de hora em hora; nulo quando o servidor não agenda. */
  nextScheduledAt: string | null
  retentionDays: number
  connections: BankSyncConnectionSummary[]
}

/** Item que o webhook da Pluggy anunciou e nunca virou conexão no app. */
export interface BankOrphanItem {
  itemId: string
  connectorName: string | null
  /** Quando o webhook anunciou o item pela primeira vez. */
  firstSeenAt: string
}

import type { TransactionType } from '@/features/transactions/types'

/** Item de um grupo da busca global (conta, cartão, categoria, recorrência, parcelamento). */
export interface SearchHit {
  id: string
  title: string
  /** Linha secundária; pode vir nula. */
  subtitle: string | null
}

export interface TransactionSearchHit extends SearchHit {
  /** Data de competência (ISO). */
  date: string
  amount: string
  type: TransactionType
}

/** Resposta de `GET /search`: até 10 itens por grupo, só do usuário e sem apagados. */
export interface SearchResponse {
  transactions: TransactionSearchHit[]
  accounts: SearchHit[]
  creditCards: SearchHit[]
  categories: SearchHit[]
  recurrences: SearchHit[]
  installments: SearchHit[]
}

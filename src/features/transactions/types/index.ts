/** Espelha `domain/entity/TransactionType.java` — os 5 valores que o backend devolve. */
export type TransactionType = 'INCOME' | 'EXPENSE' | 'REFUND' | 'TRANSFER' | 'MANUAL_ADJUSTMENT'
export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export const PAYMENT_METHOD_SLUGS = [
  'CASH',
  'PIX',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'BANK_TRANSFER',
  'BOLETO',
  'OTHER',
] as const
export type PaymentMethodSlug = (typeof PAYMENT_METHOD_SLUGS)[number]

export interface PaymentMethod {
  id: string
  slug: PaymentMethodSlug
  name: string
}

export interface Transaction {
  id: string
  description: string
  amount: string
  type: TransactionType
  status: TransactionStatus
  accountId: string
  categoryId: string | null
  competenceDate: string
  paymentDate: string | null
  createdAt: string
  paymentMethod: PaymentMethod
  creditCard: { id: string; name: string; brand: string } | null
  notes?: string
  accountName?: string
  categoryName?: string
  /** Série de parcelamento à qual a transação pertence. Null fora de parcelamentos. */
  installmentSeriesId?: string | null
  installmentNumber?: number | null
  totalInstallments?: number | null
  /**
   * Preenchidos apenas nas linhas colapsadas (`groupInstallments=true`): a linha representa
   * a compra inteira, não uma parcela.
   */
  installmentTotalAmount?: string | null
  paidInstallments?: number | null
  installmentGroup?: boolean
  recurrenceId?: string
  updatedAt?: string
}

export interface TransactionSummary {
  id: string
  description: string
  amount: string
  type: TransactionType
  status: TransactionStatus
  accountId: string
  accountName?: string
  categoryId: string | null
  categoryName?: string
  competenceDate: string
  paymentDate: string | null
  createdAt: string
  paymentMethod: PaymentMethod
}

export interface Attachment {
  id: string
  transactionId: string
  fileName: string
  contentType: string
  size: number
  url: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ListTransactionsParams {
  accountId?: string
  type?: TransactionType
  status?: TransactionStatus
  categoryId?: string
  paymentMethod?: PaymentMethodSlug
  competenceDateFrom?: string
  competenceDateTo?: string
  paymentDateFrom?: string
  paymentDateTo?: string
  amountMin?: string
  amountMax?: string
  searchText?: string
  includeCancelled?: boolean
  /** Colapsa cada parcelamento em uma linha só, representando a compra inteira. */
  groupInstallments?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface CreateTransactionRequest {
  description: string
  amount: string
  type: TransactionType
  accountId: string
  categoryId?: string
  competenceDate: string
  status: TransactionStatus
  notes?: string
  paymentMethod?: PaymentMethodSlug
  creditCardId?: string
}

export interface UpdateTransactionRequest {
  description: string
  amount: string
  categoryId?: string
  competenceDate: string
  notes?: string
}

export interface MarkAsPaidRequest {
  paymentDate?: string
}

// ── Importação de extrato ───────────────────────────────────────────────────

/** Espelha `domain/entity/StatementFormat.java`. */
export const STATEMENT_FORMATS = ['INTER_CSV'] as const
export type StatementFormat = (typeof STATEMENT_FORMATS)[number]

export const STATEMENT_FORMAT_LABELS: Record<StatementFormat, string> = {
  INTER_CSV: 'Banco Inter (CSV)',
}

export interface ImportRowError {
  lineNumber: number
  message: string
}

/** De onde veio a categoria sugerida, na ordem em que o backend as resolve. */
export type SuggestionSource = 'RULE' | 'HISTORY' | 'NONE'

export interface ImportPreviewRow {
  lineNumber: number
  /** Hash da linha de origem. Devolvido inalterado na confirmação — é a chave de deduplicação. */
  externalRef: string
  date: string
  description: string
  /** Coluna "Histórico" do extrato, para o usuário conferir como a linha foi classificada. */
  rawHistory: string
  amount: string
  type: TransactionType
  paymentMethod: PaymentMethodSlug
  /**
   * Identidade do estabelecimento, derivada da descrição. `null` quando a descrição não
   * deixa nada identificável. É por ela que "aplicar a todas as linhas deste
   * estabelecimento" agrupa as linhas da prévia.
   */
  merchantKey: string | null
  /**
   * Como o usuário renomeou este estabelecimento da última vez, ou `null` se nunca
   * renomeou. Não substitui `description`, que continua sendo o texto do arquivo: a tela
   * pré-preenche o apelido e mostra o original ao lado.
   */
  suggestedDescription: string | null
  suggestedCategoryId: string | null
  suggestedCategoryName: string | null
  suggestedSubcategoryId: string | null
  suggestedSubcategoryName: string | null
  /** De onde veio a sugestão: regra do usuário, histórico do estabelecimento, ou nenhuma. */
  suggestionSource: SuggestionSource
  /** Já existe nesta conta: veio de uma importação anterior. */
  duplicate: boolean
  /** Histórico desconhecido: o tipo foi deduzido do sinal do valor e merece revisão. */
  unknownHistory: boolean
}

export interface ImportPreviewResponse {
  fileName: string
  format: StatementFormat
  sourceAccountLabel: string | null
  periodStart: string | null
  periodEnd: string | null
  totalRows: number
  importableCount: number
  duplicateCount: number
  warningCount: number
  rows: ImportPreviewRow[]
  errors: ImportRowError[]
}

export interface ImportCommitRow {
  lineNumber: number
  externalRef: string
  date: string
  description: string
  /**
   * A descrição como o arquivo a trouxe, sem edição. Não vai para o lançamento: é a
   * identidade do estabelecimento com que o servidor grava (ou apaga) o apelido.
   */
  originalDescription: string
  amount: string
  type: TransactionType
  paymentMethod: PaymentMethodSlug
  categoryId?: string | null
}

export interface ImportCommitRequest {
  accountId: string
  format: StatementFormat
  rows: ImportCommitRow[]
}

export interface ImportResultResponse {
  imported: number
  skippedDuplicates: number
  failed: number
  errors: ImportRowError[]
}

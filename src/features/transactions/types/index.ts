/** Espelha `domain/entity/TransactionType.java` — os valores que o backend devolve. */
export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'REFUND'
  | 'TRANSFER'
  | 'MANUAL_ADJUSTMENT'
  | 'INVOICE_PAYMENT'
export type TransactionStatus = 'PENDING' | 'OVERDUE' | 'PAID' | 'CANCELLED'

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
  /** Só em INVOICE_PAYMENT: a fatura que este pagamento quitou. */
  paidInvoiceId?: string | null
  notes?: string
  accountName?: string
  categoryName?: string
  subcategoryName?: string | null
  cancelledAt?: string | null
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
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  uploadedAt: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/** Totais de tudo que casa com o filtro (todas as páginas), sem as canceladas. */
export interface TransactionTotals {
  incomeAmount: string
  incomeCount: number
  expenseAmount: string
  expenseCount: number
  /** Pagamentos de fatura: tiram dinheiro da conta, mas as compras já contam em despesas. */
  invoicePaymentAmount: string
  invoicePaymentCount: number
  netAmount: string
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
  /** Só com status PAID; ausente, o backend usa a data de competência. */
  paymentDate?: string
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
  status?: TransactionStatus
  paymentDate?: string
  notes?: string
  paymentMethod?: PaymentMethodSlug
  creditCardId?: string
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
  /** O dinheiro saiu da conta. Dá a direção de uma TRANSFER. */
  outgoing: boolean
  /** Conta do outro lado quando o tipo é TRANSFER (aplicação ou resgate). */
  transferAccountId: string | null
  transferAccountName: string | null
  /**
   * Fatura que a linha paga. Com tipo INVOICE_PAYMENT, já casada; com EXPENSE e
   * `invoiceAmountMismatch`, só uma sugestão para o usuário confirmar.
   */
  invoiceId: string | null
  /** Cartão e mês da fatura, ex.: "Inter - PF · 2026-09". */
  invoiceLabel: string | null
  /** A descrição indica pagamento de fatura, mas o valor não bate com o total da sugerida. */
  invoiceAmountMismatch: boolean
  /** Faturas que esta linha de saída pode pagar, as de vencimento mais próximo primeiro. */
  invoiceOptions: ImportInvoiceOption[]
  /** Aplicação ou resgate de investimento. */
  investment: boolean
  /** Parece pagamento de fatura, mas nenhuma fatura com vencimento próximo existe. */
  invoicePaymentUnmatched: boolean
}

export interface ImportInvoiceOption {
  id: string
  label: string
  totalAmount: string
  dueDate: string
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
  /** Há aplicação/resgate e nenhuma conta de investimento para recebê-los. */
  investmentAccountMissing: boolean
  /** Há lançamentos novos anteriores à criação da conta. */
  keepCurrentBalanceSuggested: boolean
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
  outgoing?: boolean
  transferAccountId?: string | null
  invoiceId?: string | null
}

export interface ImportCommitRequest {
  accountId: string
  format: StatementFormat
  rows: ImportCommitRow[]
  /** Compensa o efeito dos lançamentos com um saldo de abertura, sem mudar o saldo atual. */
  keepCurrentBalance?: boolean
}

export interface ImportResultResponse {
  imported: number
  skippedDuplicates: number
  failed: number
  errors: ImportRowError[]
}

export interface ReceiptPreviewResponse {
  /**
   * Chave de deduplicação: o endToEndId do PIX quando o comprovante o traz, senão um hash
   * de data+valor+destinatário. `null` quando nada foi lido — nesse caso a duplicata não
   * pode ser checada até o usuário preencher os campos na revisão.
   */
  externalRef: string | null
  amount: string | null
  date: string | null
  recipientName: string | null
  recipientDocument: string | null
  institution: string | null
  message: string | null
  /** Identidade do destinatário, derivada de recipientName — mesma ideia de merchantKey. */
  merchantKey: string | null
  /** Como o usuário renomeou este destinatário da última vez, ou `null` se nunca renomeou. */
  suggestedDescription: string | null
  suggestedCategoryId: string | null
  suggestedCategoryName: string | null
  suggestedSubcategoryId: string | null
  suggestedSubcategoryName: string | null
  suggestionSource: SuggestionSource
  duplicate: boolean
  duplicateTransactionId: string | null
  /** Campos que a leitura não conseguiu identificar, ex: `["destinatário"]`. */
  unreadFields: string[]
  /** Nada pôde ser lido do arquivo — a tela cai para preenchimento manual. */
  unreadable: boolean
}

export interface ReceiptCommitRequest {
  accountId: string
  externalRef: string
  type: TransactionType
  amount: string
  description: string
  /**
   * O nome do destinatário como o comprovante trouxe, antes de qualquer edição do
   * usuário. É dele que o servidor deriva o apelido a lembrar.
   */
  originalDescription: string
  competenceDate: string
  categoryId?: string | null
  subcategoryId?: string | null
  status?: TransactionStatus
}

export type ReconciliationKind = 'INVOICE_PAYMENT' | 'INVESTMENT' | 'SERIES_MERGE'

/** Correção proposta para um lançamento importado antes das regras atuais do import. */
export interface ReconciliationProposal {
  kind: ReconciliationKind
  /** Transação a converter; em SERIES_MERGE, a série que fica. */
  id: string
  date: string
  description: string
  amount: string
  accountName: string
  /** O que vai acontecer, em pt-BR. */
  detail: string
}

export interface ImportReconciliationResponse {
  investmentAccountMissing: boolean
  proposals: ReconciliationProposal[]
}

export interface ApplyReconciliationRequest {
  items: { kind: ReconciliationKind; id: string }[]
}

export interface ApplyReconciliationResult {
  invoicePayments: number
  investments: number
  seriesMerged: number
  skipped: number
}

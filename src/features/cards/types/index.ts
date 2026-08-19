export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'OTHER'
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'PARTIALLY_PAID' | 'PARTIAL' | 'OVERDUE'

export interface Card {
  id: string
  name: string
  brand: CardBrand
  issuer?: string
  /** Últimos 4 dígitos do cartão. É o que casa cada seção do PDF da fatura com o cartão. */
  last4Digits?: string | null
  creditLimit: string
  currentInvoiceTotal?: string
  closingDay: number
  dueDay: number
  archivedAt: string | null
  sharedLimitGroupId?: string | null
  createdAt: string
  updatedAt?: string
}

export interface InvoiceItem {
  id: string
  description: string
  amount: string
  competenceDate: string
  categoryId: string | null
  categoryName?: string | null
  subcategoryId?: string | null
  subcategoryName?: string | null
  notes?: string
  isRevolving?: boolean
  installmentNumber?: number | null
  totalInstallments?: number | null
  transactionId?: string | null
}

export interface Invoice {
  id: string
  creditCardId: string
  referenceMonth: string
  closingDate?: string
  totalAmount: string
  paidAmount: string
  status: InvoiceStatus
  dueDate: string
  items: InvoiceItem[]
}

export interface LimitUsage {
  cardId?: string
  creditLimit: string
  usedLimit: string
  availableLimit: string
  usagePercentage?: string
}

export interface SpendingItem {
  categoryId: string | null
  categoryName: string | null
  totalAmount: string
  percentage: string
}

export interface CreateCardRequest {
  name: string
  brand: CardBrand
  issuer?: string
  last4Digits?: string
  creditLimit: string
  closingDay: number
  dueDay: number
}

export type UpdateCardRequest = CreateCardRequest

export interface PayInvoiceRequest {
  amount: string
  accountId: string
}

export interface SpendingBreakdownParams {
  from: string
  to: string
}

// ── Importação de fatura em PDF ──────────────────────────────────────────────

export const INVOICE_IMPORT_FORMATS = ['INTER_FATURA_PDF'] as const
export type InvoiceImportFormat = (typeof INVOICE_IMPORT_FORMATS)[number]

export const INVOICE_IMPORT_FORMAT_LABELS: Record<InvoiceImportFormat, string> = {
  INTER_FATURA_PDF: 'Banco Inter (PDF da fatura)',
}

export interface FaturaImportRowError {
  lineNumber: number
  message: string
}

/** De onde veio a categoria sugerida, na ordem em que o backend as resolve. */
export type SuggestionSource = 'RULE' | 'HISTORY' | 'NONE'

export interface FaturaImportPreviewRow {
  lineNumber: number
  /** Hash da linha de origem. Devolvido inalterado na confirmação — é a chave de deduplicação. */
  externalRef: string
  /**
   * Posição da linha dentro do grupo de linhas idênticas do arquivo (0 para a primeira).
   * Devolvido inalterado na confirmação: compõe a identidade da linha quando duas compras
   * do mesmo dia são indistinguíveis, e é dela que sai a chave das parcelas futuras.
   */
  ordinal: number
  date: string
  description: string
  amount: string
  installmentNumber: number | null
  totalInstallments: number | null
  /**
   * Identidade do estabelecimento, derivada da descrição. `null` quando a descrição não
   * deixa nada identificável. É por ela que "aplicar a todas as linhas deste
   * estabelecimento" agrupa as linhas da prévia.
   */
  merchantKey: string | null
  suggestedCategoryId: string | null
  suggestedCategoryName: string | null
  suggestedSubcategoryId: string | null
  suggestedSubcategoryName: string | null
  /** De onde veio a sugestão: regra do usuário, histórico do estabelecimento, ou nenhuma. */
  suggestionSource: SuggestionSource
  /** Já existe na fatura deste mês: veio de uma importação anterior. */
  duplicate: boolean
}

/**
 * Uma seção "CARTÃO ****XXXX" do PDF. Um PDF do Inter cobre o titular e os
 * adicionais, então o cartão é escolhido por grupo, e não uma vez para o arquivo todo.
 */
export interface FaturaImportGroupPreview {
  cardLast4: string
  /** Cartão com os mesmos `last4Digits`. Null quando nenhum casou e o usuário precisa escolher. */
  suggestedCreditCardId: string | null
  suggestedCreditCardName: string | null
  rows: FaturaImportPreviewRow[]
}

export interface FaturaImportPreviewResponse {
  fileName: string
  format: InvoiceImportFormat
  dueDate: string
  referenceMonth: string
  totalAmount: string | null
  groups: FaturaImportGroupPreview[]
  totalRows: number
  duplicateCount: number
  /** Créditos (pagamento da fatura, estorno) descartados na leitura. */
  excludedPaymentsCount: number
  errors: FaturaImportRowError[]
}

/**
 * Pergunta ao servidor quais linhas da prévia já estão na fatura de um cartão escolhido
 * à mão. A prévia só marca duplicatas dos grupos cujo cartão ela sugeriu; quando o
 * usuário troca o cartão de destino, a marcação passa a valer para outra fatura.
 */
export interface FaturaImportDuplicateCheckRequest {
  creditCardId: string
  referenceMonth: string
  externalRefs: string[]
}

export interface FaturaImportDuplicateCheckResponse {
  /** Subconjunto dos `externalRefs` enviados que já foram importados. */
  duplicateExternalRefs: string[]
}

export interface FaturaImportCommitRow {
  lineNumber: number
  creditCardId: string
  /** Seção do PDF de onde a linha saiu. Compõe a identidade usada na deduplicação. */
  cardLast4: string
  externalRef: string
  /** O `ordinal` da prévia, devolvido sem alteração. */
  ordinal: number
  date: string
  description: string
  /**
   * A descrição como o PDF a trouxe. Não vai para o lançamento — o servidor deriva dela
   * a chave das parcelas seguintes, que precisa bater com o PDF do mês que vem.
   */
  originalDescription: string
  amount: string
  installmentNumber?: number | null
  totalInstallments?: number | null
  categoryId?: string | null
}

export interface FaturaImportCommitRequest {
  format: InvoiceImportFormat
  referenceMonth: string
  /** Conta que recebe as transações de cartão — uma só para o arquivo inteiro. */
  accountId: string
  rows: FaturaImportCommitRow[]
  /**
   * A fatura deste mês já foi paga na vida real. Quando `true`, o servidor marca a fatura
   * do mês de referência como paga (pago = total) ao fim da importação. As compras seguem
   * pendentes e o saldo da conta não se move — só a fatura registra o pagamento.
   */
  alreadyPaid: boolean
}

export interface FaturaImportResultResponse {
  imported: number
  /** Parcelas seguintes geradas junto, nas faturas dos próximos meses. */
  futureInstallments: number
  skippedDuplicates: number
  failed: number
  /** Faturas marcadas como pagas — uma por cartão do PDF, só quando `alreadyPaid`. */
  markedPaidInvoices: number
  errors: FaturaImportRowError[]
}

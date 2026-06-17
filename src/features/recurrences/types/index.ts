export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'

export type RecurrenceStatus = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'DELETED'

export type RecurrenceType = 'INCOME' | 'EXPENSE' | 'REFUND'

export type DeleteRecurrenceStrategy = 'FUTURE_ONLY' | 'ALL'

export interface Recurrence {
  id: string
  description: string
  amount: string
  type: RecurrenceType
  frequency: RecurrenceFrequency
  accountId: string
  accountName?: string | null
  categoryId: string | null
  categoryName?: string | null
  startDate: string
  endDate?: string | null
  nextOccurrenceDate: string | null
  status: RecurrenceStatus
  pausedAt?: string | null
  resumeAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateRecurrenceRequest {
  description: string
  amount: string
  frequency: RecurrenceFrequency
  type: RecurrenceType
  accountId: string
  categoryId?: string
  startDate: string
  endDate?: string
}

export interface UpdateRecurrenceRequest {
  description: string
  amount: string
  accountId: string
  categoryId?: string
}

export interface PauseRecurrenceRequest {
  resumeAt?: string
}

export interface DeleteRecurrenceParams {
  id: string
  strategy: DeleteRecurrenceStrategy
}

export interface RecurrenceCreationResponse {
  rule: Recurrence
  firstInstance: unknown
}

export interface EditRecurrenceResult {
  rule: Recurrence
  updatedInstances: number
}

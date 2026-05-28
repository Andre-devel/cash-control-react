export type RecurrenceFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'

export type RecurrenceStatus = 'ACTIVE' | 'PAUSED'

export type RecurrenceType = 'INCOME' | 'EXPENSE' | 'REFUND'

export type DeleteRecurrenceStrategy = 'FUTURE_ONLY' | 'ALL'

export interface Recurrence {
  id: string
  description: string
  amount: string
  type: RecurrenceType
  frequency: RecurrenceFrequency
  accountId: string
  categoryId: string | null
  startDate: string
  nextExecutionDate: string | null
  status: RecurrenceStatus
  pausedUntil?: string
  endDate?: string
  createdAt: string
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
  frequency: RecurrenceFrequency
  type: RecurrenceType
  accountId: string
  categoryId?: string
  startDate: string
  endDate?: string
}

export interface PauseRecurrenceRequest {
  pausedUntil?: string
}

export interface DeleteRecurrenceParams {
  id: string
  strategy: DeleteRecurrenceStrategy
}

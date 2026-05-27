import type { z } from 'zod'
import { createTransactionSchema } from './create-transaction.schema'

export const updateTransactionSchema = createTransactionSchema

export type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>

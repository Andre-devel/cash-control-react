import type { z } from 'zod'
import { createAccountSchema } from './create-account.schema'

export const updateAccountSchema = createAccountSchema

export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>

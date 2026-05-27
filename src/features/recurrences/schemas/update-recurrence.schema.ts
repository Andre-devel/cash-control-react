import { createRecurrenceSchema } from './create-recurrence.schema'
import type { CreateRecurrenceFormValues } from './create-recurrence.schema'

export const updateRecurrenceSchema = createRecurrenceSchema

export type UpdateRecurrenceFormValues = CreateRecurrenceFormValues

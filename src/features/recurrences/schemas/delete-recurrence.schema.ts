import { z } from 'zod'

export const DELETE_RECURRENCE_STRATEGIES = ['FUTURE_ONLY', 'ALL'] as const

export const deleteRecurrenceSchema = z.object({
  strategy: z.enum(DELETE_RECURRENCE_STRATEGIES, {
    message: 'Estratégia de exclusão é obrigatória',
  }),
})

export type DeleteRecurrenceFormValues = z.infer<typeof deleteRecurrenceSchema>

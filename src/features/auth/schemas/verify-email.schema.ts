import { z } from 'zod'

export const resendVerificationSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Informe um e-mail válido'),
})

export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>

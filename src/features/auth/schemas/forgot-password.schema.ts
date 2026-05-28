import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Informe um e-mail válido'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

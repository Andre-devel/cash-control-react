import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const adjustBalanceSchema = z.object({
  targetBalance: moneyField('Saldo deve ser um decimal válido (ex: 1.250,40 ou -50,00)', {
    signed: true,
  }),
  description: z.string().max(255, 'Observação deve ter no máximo 255 caracteres').optional(),
})

export type AdjustBalanceFormValues = z.infer<typeof adjustBalanceSchema>

/**
 * O usuário informa o saldo que o banco mostra; a API recebe o ajuste (delta) a lançar.
 * Em centavos para não herdar erro de ponto flutuante.
 */
export function adjustmentDelta(currentBalance: string, targetBalance: string): string {
  const cents = Math.round(Number(targetBalance) * 100) - Math.round(Number(currentBalance) * 100)
  return (cents / 100).toFixed(2)
}

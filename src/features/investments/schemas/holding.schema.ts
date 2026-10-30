import { z } from 'zod'
import { moneyField, normalizeMoneyInput } from '@/lib/money'

const RATE_PATTERN = /^\d+(\.\d{1,4})?$/
const QUANTITY_PATTERN = /^\d+(\.\d{1,8})?$/

/** Taxa digitada com vírgula ("110" ou "6,25"), entregue com ponto; vazio vira "". */
function decimalText(pattern: RegExp, message: string) {
  return z
    .string()
    .transform((value) => normalizeMoneyInput(value))
    .refine((value) => value === '' || pattern.test(value), message)
}

export const holdingSchema = z
  .object({
    accountId: z.string().min(1, 'Escolha a conta de investimento'),
    kind: z.enum(['CDB', 'LCI', 'LCA', 'TESOURO_DIRETO', 'OTHER']),
    indexer: z.union([
      z.enum(['CDI_PERCENT', 'CDI_SPREAD', 'PREFIXED', 'IPCA_SPREAD', 'SELIC_PERCENT']),
      z.literal(''),
    ]),
    rate: decimalText(RATE_PATTERN, 'Taxa deve ser um número (ex: 110 ou 6,25)'),
    name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'No máximo 100 caracteres'),
    issuer: z.string().max(100, 'No máximo 100 caracteres'),
    taxExempt: z.boolean(),
    liquidity: z.enum(['DAILY', 'AT_MATURITY']),
    appliedAt: z.string().min(1, 'Data da aplicação é obrigatória'),
    maturityDate: z.string(),
    principal: moneyField('Valor deve ser um decimal válido (ex: 1.000,00)', { positive: true }),
    treasuryBond: z.string(),
    treasuryQuantity: decimalText(QUANTITY_PATTERN, 'Quantidade deve ser um número (ex: 0,35)'),
    funding: z.enum(['TRANSFER', 'EXISTING']),
    fromAccountId: z.string(),
    notes: z.string().max(5000, 'No máximo 5000 caracteres'),
  })
  .superRefine((data, ctx) => {
    const isTreasury = data.kind === 'TESOURO_DIRETO'
    if (!isTreasury && data.kind !== 'OTHER') {
      if (!data.indexer)
        ctx.addIssue({ code: 'custom', path: ['indexer'], message: 'Escolha o indexador' })
      if (!data.rate) ctx.addIssue({ code: 'custom', path: ['rate'], message: 'Informe a taxa' })
    }
    if (data.kind === 'OTHER' && data.indexer && !data.rate) {
      ctx.addIssue({ code: 'custom', path: ['rate'], message: 'Informe a taxa' })
    }
    if (isTreasury && !data.treasuryBond) {
      ctx.addIssue({ code: 'custom', path: ['treasuryBond'], message: 'Escolha o título' })
    }
    if (!isTreasury && data.liquidity === 'AT_MATURITY' && !data.maturityDate) {
      ctx.addIssue({ code: 'custom', path: ['maturityDate'], message: 'Informe o vencimento' })
    }
    if (data.maturityDate && data.maturityDate <= data.appliedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['maturityDate'],
        message: 'O vencimento deve ser depois da aplicação',
      })
    }
    if (data.funding === 'TRANSFER' && !data.fromAccountId) {
      ctx.addIssue({
        code: 'custom',
        path: ['fromAccountId'],
        message: 'Escolha a conta de origem',
      })
    }
  })

export type HoldingFormInput = z.input<typeof holdingSchema>
export type HoldingFormValues = z.output<typeof holdingSchema>

/** Título do Tesouro como valor de `<select>`: tipo e vencimento numa string só. */
export function treasuryBondValue(bondType: string, maturityDate: string): string {
  return `${bondType}|${maturityDate}`
}

export function parseTreasuryBondValue(value: string): { bondType: string; maturityDate: string } {
  const [bondType, maturityDate] = value.split('|')
  return { bondType, maturityDate }
}

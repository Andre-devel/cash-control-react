import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/
const SIGNED_DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/

/**
 * Normaliza um valor monetário digitado para o formato decimal que a API espera.
 *
 * O teclado pt-BR entrega vírgula como separador decimal, então `1.500,00` e
 * `1500,00` viram `1500.00`. Quando não há vírgula o texto é preservado — o ponto
 * continua sendo o separador decimal e entradas inválidas seguem inválidas.
 */
export function normalizeMoneyInput(value: string): string {
  const trimmed = value.trim().replace(/\s/g, '')
  if (!trimmed.includes(',')) return trimmed
  return trimmed.replace(/\./g, '').replace(',', '.')
}

/**
 * Campo de valor monetário: aceita vírgula ou ponto e entrega sempre `1500.00`
 * para quem consumir o resultado do parse.
 */
export function moneyField(message: string, options?: { signed?: boolean }) {
  const pattern = options?.signed ? SIGNED_DECIMAL_PATTERN : DECIMAL_PATTERN
  return z
    .string()
    .transform(normalizeMoneyInput)
    .refine((value) => pattern.test(value), message)
}

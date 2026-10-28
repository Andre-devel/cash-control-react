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
 * para quem consumir o resultado do parse. `positive` recusa zero.
 */
export function moneyField(message: string, options?: { signed?: boolean; positive?: boolean }) {
  const pattern = options?.signed ? SIGNED_DECIMAL_PATTERN : DECIMAL_PATTERN
  const field = z
    .string()
    .transform(normalizeMoneyInput)
    .refine((value) => pattern.test(value), message)
  // A API recusa zero (`@DecimalMin("0.01")`); sem isto o erro só aparecia como
  // "Falha na validação da requisição." depois do envio.
  return options?.positive
    ? field.refine(
        (value) => !pattern.test(value) || Number(value) > 0,
        'Valor deve ser maior que zero',
      )
    : field
}

/**
 * Valor da API (`"1250.4"`) no formato que o usuário digita: `"1.250,40"`. É o que os
 * formulários de edição devem pré-preencher — `normalizeMoneyInput` lê de volta.
 */
export function formatMoneyInput(value: string | number): string {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return String(value)
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Valor da API (`"6997.9"`) formatado para exibição: `R$ 6.997,90`. */
export function formatMoney(value: string | number, currency = 'BRL'): string {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return String(value)
  return number.toLocaleString('pt-BR', { style: 'currency', currency })
}

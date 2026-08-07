import { describe, it, expect } from 'vitest'
import { normalizeMoneyInput, moneyField } from '../money'

describe('normalizeMoneyInput', () => {
  it('converte vírgula decimal do teclado pt-BR em ponto', () => {
    expect(normalizeMoneyInput('1500,00')).toBe('1500.00')
    expect(normalizeMoneyInput('0,5')).toBe('0.5')
  })

  it('remove o separador de milhar quando há vírgula decimal', () => {
    expect(normalizeMoneyInput('1.500,00')).toBe('1500.00')
    expect(normalizeMoneyInput('1.234.567,89')).toBe('1234567.89')
  })

  it('preserva o ponto como decimal quando não há vírgula', () => {
    expect(normalizeMoneyInput('1500.00')).toBe('1500.00')
    expect(normalizeMoneyInput('1500')).toBe('1500')
  })

  it('preserva o sinal negativo', () => {
    expect(normalizeMoneyInput('-50,00')).toBe('-50.00')
  })

  it('descarta espaços', () => {
    expect(normalizeMoneyInput('  1 500,00 ')).toBe('1500.00')
  })

  it('deixa entrada inválida intacta para a validação recusar', () => {
    expect(normalizeMoneyInput('abc')).toBe('abc')
  })
})

describe('moneyField', () => {
  const schema = moneyField('inválido')

  it('aceita ponto e vírgula, entregando sempre o formato da API', () => {
    expect(schema.parse('150,75')).toBe('150.75')
    expect(schema.parse('150.75')).toBe('150.75')
    expect(schema.parse('1.500,00')).toBe('1500.00')
  })

  it('recusa mais de duas casas decimais', () => {
    expect(schema.safeParse('150,123').success).toBe(false)
    expect(schema.safeParse('150.123').success).toBe(false)
  })

  it('recusa texto que não é número', () => {
    const result = schema.safeParse('abc')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('inválido')
  })

  it('recusa negativo por padrão e aceita com signed', () => {
    expect(schema.safeParse('-50,00').success).toBe(false)
    expect(moneyField('inválido', { signed: true }).parse('-50,00')).toBe('-50.00')
  })
})

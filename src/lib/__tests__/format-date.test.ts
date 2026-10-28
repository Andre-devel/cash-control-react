import { describe, it, expect } from 'vitest'
import { formatLocalDate, formatShortDate, formatYearMonth } from '../format-date'

describe('formatLocalDate', () => {
  it('formata aaaa-mm-dd sem deslocar o dia por fuso', () => {
    expect(formatLocalDate('2026-11-01')).toBe('01/11/2026')
  })

  it('vazio vira travessão e texto fora do padrão passa intacto', () => {
    expect(formatLocalDate(null)).toBe('—')
    expect(formatLocalDate('ontem')).toBe('ontem')
  })
})

describe('formatShortDate', () => {
  it('dia e mês abreviado em pt-BR', () => {
    expect(formatShortDate('2026-11-05')).toBe('05 nov')
  })
})

describe('formatYearMonth', () => {
  it('aceita aaaa-mm e aaaa-mm-dd', () => {
    expect(formatYearMonth('2026-09')).toBe('set/2026')
    expect(formatYearMonth('2026-06-01')).toBe('jun/2026')
  })
})

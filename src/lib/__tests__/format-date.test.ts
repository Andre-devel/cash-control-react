import { describe, it, expect } from 'vitest'
import { formatLocalDate } from '../format-date'

describe('formatLocalDate', () => {
  it('formata aaaa-mm-dd sem deslocar o dia por fuso', () => {
    expect(formatLocalDate('2026-11-01')).toBe('01/11/2026')
  })

  it('vazio vira travessão e texto fora do padrão passa intacto', () => {
    expect(formatLocalDate(null)).toBe('—')
    expect(formatLocalDate('ontem')).toBe('ontem')
  })
})

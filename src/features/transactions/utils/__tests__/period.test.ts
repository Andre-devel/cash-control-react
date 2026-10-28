import { describe, it, expect } from 'vitest'
import { parsePeriod, periodLabel, periodRange, serializePeriod, shiftPeriod } from '../period'

const TODAY = new Date(2026, 9, 27)

describe('period', () => {
  it('sem parâmetro, usa o mês atual', () => {
    expect(parsePeriod(null, TODAY)).toEqual({ kind: 'month', year: 2026, month: 9 })
  })

  it('lê aaaa-mm e "all"; valor inválido cai no mês atual', () => {
    expect(parsePeriod('2025-02', TODAY)).toEqual({ kind: 'month', year: 2025, month: 1 })
    expect(parsePeriod('all', TODAY)).toEqual({ kind: 'all' })
    expect(parsePeriod('2025-13', TODAY)).toEqual({ kind: 'month', year: 2026, month: 9 })
  })

  it('o intervalo vai do dia 1 ao último dia do mês', () => {
    expect(periodRange({ kind: 'month', year: 2028, month: 1 })).toEqual({
      competenceDateFrom: '2028-02-01',
      competenceDateTo: '2028-02-29',
    })
    expect(periodRange({ kind: 'all' })).toEqual({})
  })

  it('navega entre meses atravessando o ano', () => {
    const jan = shiftPeriod({ kind: 'month', year: 2026, month: 11 }, 1)
    expect(serializePeriod(jan)).toBe('2027-01')
    expect(serializePeriod(shiftPeriod(jan, -1))).toBe('2026-12')
  })

  it('rótulo em pt-BR', () => {
    expect(periodLabel({ kind: 'month', year: 2026, month: 9 })).toBe('outubro de 2026')
    expect(periodLabel({ kind: 'all' })).toBe('Todo o período')
  })
})

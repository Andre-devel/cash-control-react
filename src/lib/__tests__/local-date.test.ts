import { describe, it, expect } from 'vitest'
import { daysUntil, localIsoDate, parseLocalDate } from '@/lib/local-date'

describe('localIsoDate', () => {
  it('formata a data local, não a UTC', () => {
    // 23:30 do dia 15 no fuso local continua sendo dia 15.
    expect(localIsoDate(new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15')
  })

  it('preenche mês e dia com zero à esquerda', () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('parseLocalDate', () => {
  it('monta meia-noite local, sem voltar um dia', () => {
    const date = parseLocalDate('2026-11-27')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 27])
  })
})

describe('daysUntil', () => {
  const today = new Date(2026, 9, 28, 22, 30)

  it('conta dias corridos ignorando a hora de agora', () => {
    expect(daysUntil('2026-10-28', today)).toBe(0)
    expect(daysUntil('2026-11-05', today)).toBe(8)
  })

  it('fica negativo depois do vencimento', () => {
    expect(daysUntil('2026-10-25', today)).toBe(-3)
  })
})

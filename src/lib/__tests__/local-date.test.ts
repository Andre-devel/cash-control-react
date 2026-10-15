import { describe, it, expect } from 'vitest'
import { localIsoDate } from '@/lib/local-date'

describe('localIsoDate', () => {
  it('formata a data local, não a UTC', () => {
    // 23:30 do dia 15 no fuso local continua sendo dia 15.
    expect(localIsoDate(new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15')
  })

  it('preenche mês e dia com zero à esquerda', () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

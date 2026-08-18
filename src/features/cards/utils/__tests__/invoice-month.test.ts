import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  dueMonthLabel,
  dueMonthLabelWithYear,
  getCurrentInvoiceMonth,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'

describe('invoice-month', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('shiftMonth', () => {
    it('walks forward and backward across the year boundary', () => {
      expect(shiftMonth('2026-04', 1)).toBe('2026-05')
      expect(shiftMonth('2026-12', 1)).toBe('2027-01')
      expect(shiftMonth('2026-01', -1)).toBe('2025-12')
      expect(shiftMonth('2026-04', 0)).toBe('2026-04')
    })
  })

  describe('dueMonthLabel', () => {
    /**
     * O caso concreto: a fatura gravada como `2026-04` fecha em abril e vence em
     * 07/05/2026 — é a que o Inter chama de "fatura de maio". O rótulo tem de dizer "Mai".
     */
    it('names the invoice by the month it is due, not the one it closes', () => {
      expect(dueMonthLabel('2026-04')).toBe('Mai')
      expect(dueMonthLabel('2026-08')).toBe('Set')
    })

    it('rolls over into the next year', () => {
      expect(dueMonthLabel('2026-12')).toBe('Jan')
      expect(dueMonthLabelWithYear('2026-12')).toBe('Jan 2027')
    })

    it('spells out the year when there is room for it', () => {
      expect(dueMonthLabelWithYear('2026-04')).toBe('Mai 2026')
    })
  })

  describe('getCurrentInvoiceMonth', () => {
    /**
     * O caso que estava errado: cartão que fecha dia 1 e vence dia 10. Em 18/08 a compra de
     * hoje cai na fatura `2026-09` (vence 10/10, "Out"), mas a fatura atual é a `2026-08`,
     * que vence em 10/09 — "Set". Derivar do fechamento devolvia a primeira.
     */
    it('is the invoice of the next due date, not the one a purchase today would land on', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 18)) // 18/08/2026

      expect(getCurrentInvoiceMonth(10)).toBe('2026-08')
      expect(dueMonthLabel(getCurrentInvoiceMonth(10))).toBe('Set')
    })

    it('still points at the unpaid invoice while its due date has not arrived', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 5)) // 05/08/2026, vencimento dia 10

      // A de 2026-07 vence em 10/08: ainda é ela que está para ser paga.
      expect(getCurrentInvoiceMonth(10)).toBe('2026-07')
    })

    it('moves on the day after the due date', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 11)) // 11/08/2026

      expect(getCurrentInvoiceMonth(10)).toBe('2026-08')
    })

    it('rolls the year backwards in January', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 0, 5)) // 05/01/2026

      expect(getCurrentInvoiceMonth(10)).toBe('2025-12')
    })
  })
})

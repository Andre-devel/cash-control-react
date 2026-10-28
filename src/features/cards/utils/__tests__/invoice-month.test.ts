import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  dueMonthLabel,
  dueMonthLabelWithYear,
  getCurrentInvoiceMonth,
  invoiceLabel,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'

/** Fecha dia 1, vence dia 10: vencimento no mesmo mês do fechamento. */
const SAME_MONTH = { closingDay: 1, dueDay: 10 }
/** Fecha dia 25, vence dia 5: vencimento no mês seguinte. */
const NEXT_MONTH = { closingDay: 25, dueDay: 5 }

describe('invoice-month', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('shiftMonth', () => {
    it('moves across year boundaries in both directions', () => {
      expect(shiftMonth('2026-04', 1)).toBe('2026-05')
      expect(shiftMonth('2026-12', 1)).toBe('2027-01')
      expect(shiftMonth('2026-01', -1)).toBe('2025-12')
      expect(shiftMonth('2026-04', 0)).toBe('2026-04')
    })
  })

  describe('dueMonthLabel', () => {
    it('is the closing month when the card is due later in the same month', () => {
      expect(dueMonthLabel('2026-11', SAME_MONTH)).toBe('Nov')
      expect(dueMonthLabelWithYear('2026-12', SAME_MONTH)).toBe('Dez 2026')
    })

    it('is the month after closing when the due day comes before the closing day', () => {
      expect(dueMonthLabel('2026-04', NEXT_MONTH)).toBe('Mai')
      expect(dueMonthLabelWithYear('2026-12', NEXT_MONTH)).toBe('Jan 2027')
    })
  })

  describe('invoiceLabel', () => {
    it('names the invoice by the month of its due date', () => {
      expect(invoiceLabel('2026-11-10')).toBe('Nov 2026')
    })
  })

  describe('getCurrentInvoiceMonth', () => {
    it('is the invoice due this month while its due date has not passed', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 5)) // 05/08/2026

      // Fecha 01/08, vence 10/08.
      expect(getCurrentInvoiceMonth(SAME_MONTH)).toBe('2026-08')
      // Fecha 25/07, vence 05/08.
      expect(getCurrentInvoiceMonth(NEXT_MONTH)).toBe('2026-07')
    })

    it('moves to the invoice due next month the day after the due date', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 7, 18)) // 18/08/2026

      expect(getCurrentInvoiceMonth(SAME_MONTH)).toBe('2026-09')
      expect(dueMonthLabel(getCurrentInvoiceMonth(SAME_MONTH), SAME_MONTH)).toBe('Set')
      expect(getCurrentInvoiceMonth(NEXT_MONTH)).toBe('2026-08')
    })

    it('rolls the year backwards in January', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 0, 5)) // 05/01/2026

      expect(getCurrentInvoiceMonth(NEXT_MONTH)).toBe('2025-12')
    })
  })
})

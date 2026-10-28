/**
 * A tradução entre o mês que o sistema guarda e o mês que o usuário reconhece.
 *
 * `referenceMonth` (`invoices.reference_month`) é o mês em que a fatura **fecha**. O
 * vencimento é o primeiro `dueDay` depois do fechamento — o backend crava isso em
 * `InvoiceCycleCalculator.dueDateFor`: no mesmo mês quando `dueDay > closingDay` (fecha
 * 01/11, vence 10/11), no mês seguinte caso contrário (fecha 25/10, vence 05/11).
 *
 * O emissor nomeia a fatura pelo mês em que ela **vence**. Por isso a chave continua sendo o
 * mês de fechamento (é ela que busca a fatura na API) e o rótulo é o mês do vencimento:
 * pela `dueDate` quando a fatura já está em mãos, pelo ciclo do cartão quando só há a chave.
 */

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/** `'2026-04'` + 1 → `'2026-05'`. Aceita delta negativo. */
export function shiftMonth(yyyyMm: string, delta: number): string {
  const [year, month] = yyyyMm.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Os dias do cartão que definem o ciclo da fatura. */
export interface InvoiceCycle {
  closingDay: number
  dueDay: number
}

function dueInSameMonth(cycle: InvoiceCycle): boolean {
  return cycle.dueDay > cycle.closingDay
}

/** `referenceMonth` → mês em que essa fatura vence. */
export function dueMonthOf(yyyyMm: string, cycle: InvoiceCycle): string {
  return shiftMonth(yyyyMm, dueInSameMonth(cycle) ? 0 : 1)
}

/**
 * O `referenceMonth` da fatura que o usuário chama de "atual": a do **próximo vencimento a
 * cair**, que é a que ele está a ponto de pagar — não a fatura em que cairia uma compra feita
 * hoje (essa é a `calculateForCharge` do backend).
 *
 * <p>Enquanto o vencimento deste mês não passou, a fatura atual é a que vence neste mês;
 * depois dele, a que vence no seguinte.
 */
export function getCurrentInvoiceMonth(cycle: InvoiceCycle): string {
  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const dueMonth = today.getDate() <= cycle.dueDay ? thisMonth : shiftMonth(thisMonth, 1)
  return shiftMonth(dueMonth, dueInSameMonth(cycle) ? 0 : -1)
}

function monthLabel(yyyyMm: string): string {
  return MONTH_LABELS[Number(yyyyMm.split('-')[1]) - 1]
}

/** `'2026-04'` → `'Mai'`, o mês em que essa fatura vence. */
export function dueMonthLabel(yyyyMm: string, cycle: InvoiceCycle): string {
  return monthLabel(dueMonthOf(yyyyMm, cycle))
}

/** `'2026-04'` → `'Mai 2026'`, para onde não cabe só a abreviação. */
export function dueMonthLabelWithYear(yyyyMm: string, cycle: InvoiceCycle): string {
  const dueMonth = dueMonthOf(yyyyMm, cycle)
  return `${monthLabel(dueMonth)} ${dueMonth.slice(0, 4)}`
}

/** Vencimento `'2026-11-10'` → `'Nov 2026'`: o nome da fatura quando ela já está em mãos. */
export function invoiceLabel(dueDate: string): string {
  return `${monthLabel(dueDate.slice(0, 7))} ${dueDate.slice(0, 4)}`
}

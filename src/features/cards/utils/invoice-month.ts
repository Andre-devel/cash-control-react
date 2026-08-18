/**
 * A tradução entre o mês que o sistema guarda e o mês que o usuário reconhece.
 *
 * `referenceMonth` (`invoices.reference_month`) é o mês em que a fatura **fecha**. O
 * vencimento cai sempre no mês seguinte — o backend crava isso em
 * `InvoiceCycleCalculator.dueDateFor`, que faz `plusMonths(1)` sobre a data de fechamento.
 *
 * Só que o emissor nomeia a fatura pelo mês em que ela **vence**: a que o Inter chama de
 * "fatura de maio" é a que fecha em abril e é gravada aqui como `2026-04`. Exibir o
 * `referenceMonth` cru fazia a aba dizer "Abr" ao lado de um vencimento em 07/05.
 *
 * Por isso a chave continua sendo o mês de fechamento (é ela que busca a fatura na API) e
 * só o rótulo passa a ser o mês do vencimento. As duas convenções conviverem em um arquivo
 * só evita que a próxima tela redescubra o deslocamento por conta própria.
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

/**
 * O `referenceMonth` da fatura que o usuário chama de "atual": a do **próximo vencimento a
 * cair**, que é a que ele está a ponto de pagar.
 *
 * <p>Sai do `dueDay`, não do `closingDay`. Derivar do fechamento responde outra pergunta —
 * "em que fatura cairia uma compra feita hoje" —, que é o que `calculateForCharge` faz no
 * backend. As duas coincidem quando o cartão fecha tarde no mês, e divergem quando fecha
 * cedo: com fechamento dia 1 e vencimento dia 10, em 18/08 a compra de hoje cai na fatura
 * `2026-09` (vence 10/10), mas a fatura atual é a `2026-08`, que vence em 10/09.
 *
 * <p>Como o vencimento é sempre no mês seguinte ao fechamento, a conta é: enquanto o
 * vencimento deste mês não passou, a fatura atual é a do mês anterior; depois dele, a deste
 * mês.
 */
export function getCurrentInvoiceMonth(dueDay: number): string {
  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return today.getDate() <= dueDay ? shiftMonth(thisMonth, -1) : thisMonth
}

/** `'2026-04'` → `'Mai'`, o mês em que essa fatura vence. */
export function dueMonthLabel(yyyyMm: string): string {
  const [, month] = shiftMonth(yyyyMm, 1).split('-').map(Number)
  return MONTH_LABELS[month - 1]
}

/** `'2026-04'` → `'Mai 2026'`, para onde não cabe só a abreviação. */
export function dueMonthLabelWithYear(yyyyMm: string): string {
  const [year] = shiftMonth(yyyyMm, 1).split('-').map(Number)
  return `${dueMonthLabel(yyyyMm)} ${year}`
}

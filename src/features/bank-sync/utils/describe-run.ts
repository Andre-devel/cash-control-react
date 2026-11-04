import type { BadgeKind } from '@/components/ui/badge'
import type {
  BankSyncConnectionSummary,
  BankSyncOutcome,
  BankSyncRun,
  BankSyncTrigger,
} from '@/features/bank-sync/types'

export const OUTCOME: Record<BankSyncOutcome, { label: string; kind: BadgeKind }> = {
  SUCCESS: { label: 'Sucesso', kind: 'paid' },
  NO_CHANGE: { label: 'Sem novidade', kind: 'muted' },
  PARTIAL: { label: 'Parcial', kind: 'pending' },
  ERROR: { label: 'Erro', kind: 'overdue' },
  ITEM_GONE: { label: 'Removida', kind: 'cancelled' },
}

const TRIGGER: Record<BankSyncTrigger, string> = {
  SCHEDULED: 'Varredura',
  WEBHOOK: 'Webhook',
  MANUAL: 'Manual',
  REGISTER: 'Cadastro',
}

/** Origem com o evento do webhook, quando houver: "Webhook · transactions/created". */
export function triggerLabel(run: Pick<BankSyncRun, 'trigger' | 'webhookEvent'>): string {
  const label = TRIGGER[run.trigger] ?? run.trigger
  return run.webhookEvent ? `${label} · ${run.webhookEvent}` : label
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Resumo de uma linha do que a execução fez; com problema, a mensagem vem primeiro. */
export function describeRun(run: BankSyncRun): string {
  const parts: string[] = []
  if (run.accountsRead != null) {
    parts.push(plural(run.accountsRead, 'conta lida', 'contas lidas'))
  }
  if (run.transactionsQueued) {
    parts.push(plural(run.transactionsQueued, 'lançamento na fila', 'lançamentos na fila'))
  }
  if (run.investmentsCreated) {
    parts.push(plural(run.investmentsCreated, 'aplicação nova', 'aplicações novas'))
  }
  if (run.investmentsRedeemed) {
    parts.push(plural(run.investmentsRedeemed, 'resgate', 'resgates'))
  }
  if (run.webhookDelayMinutes != null) {
    parts.push(`aviso ${run.webhookDelayMinutes} min depois da Pluggy`)
  }
  const summary = parts.join(' · ')
  if (run.errorMessage && run.outcome !== 'SUCCESS' && run.outcome !== 'NO_CHANGE') {
    return summary ? `${run.errorMessage} — ${summary}` : run.errorMessage
  }
  return summary || '—'
}

/** Duração em segundos com uma casa: "2,4 s". */
export function durationLabel(run: Pick<BankSyncRun, 'startedAt' | 'finishedAt'>): string {
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  return `${(ms / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`
}

/** "04/11 14:13:02": o histórico é de 30 dias, o ano não ajuda. */
export function runTime(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${day} ${time}`
}

/** "hoje às 14:13", "ontem às 15:57" ou "02/11 às 18:13". */
export function relativeDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0) return `hoje às ${time}`
  if (days === 1) return `ontem às ${time}`
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${day} às ${time}`
}

function tail(number: string | null): string {
  return number ? ` ••${number.slice(-4)}` : ''
}

/** Contas da conexão em uma linha: "BANCO INTER ••71-5 · GOLD ••7866". */
export function accountsLine(connection: Pick<BankSyncConnectionSummary, 'accounts'>): string {
  return connection.accounts.map((account) => `${account.name}${tail(account.number)}`).join(' · ')
}

/**
 * Nome curto da conexão para o histórico e o filtro. Só o conector repete quando há duas do
 * mesmo (MeuPluggy pede uma por banco), então leva o final da conta corrente.
 */
export function connectionLabel(
  connection: Pick<BankSyncConnectionSummary, 'connectorName' | 'itemId' | 'accounts'>,
): string {
  const name = connection.connectorName ?? connection.itemId.slice(0, 8)
  const main = connection.accounts.find((a) => a.kind === 'BANK') ?? connection.accounts[0]
  return main ? `${name}${tail(main.number)}` : name
}

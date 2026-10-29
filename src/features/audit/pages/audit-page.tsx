import { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  KeyRound,
  Lock,
  LogIn,
  RefreshCcw,
  ScrollText,
  Shield,
  ShieldAlert,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BadgeKind } from '@/components/ui/badge'
import { useAuditLogs } from '@/features/audit/hooks/use-audit-logs'
import { useSecuritySummary } from '@/features/audit/hooks/use-security-summary'
import type { AuditLogEntry } from '@/features/audit/types/audit.types'

const PAGE_SIZE = 20

const pulse = 'animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none'

function SummarySkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 rounded-xl border border-border bg-surface-1 p-4">
          <div className={`h-3 w-32 ${pulse}`} />
          <div className={`mt-3 h-7 w-16 ${pulse}`} />
        </div>
      ))}
    </div>
  )
}

function LogSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Carregando eventos">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className={`h-9 w-9 flex-none ${pulse}`} />
          <div className="flex flex-1 flex-col gap-2">
            <div className={`h-3.5 w-40 ${pulse}`} />
            <div className={`h-3 w-28 ${pulse}`} />
          </div>
          <div className={`h-6 w-16 ${pulse}`} />
        </div>
      ))}
    </div>
  )
}

const OUTCOME: Record<string, { label: string; kind: BadgeKind; icon: LucideIcon }> = {
  SUCCESS: { label: 'Sucesso', kind: 'paid', icon: CircleCheck },
  FAILURE: { label: 'Falha', kind: 'overdue', icon: CircleX },
  BLOCKED: { label: 'Bloqueado', kind: 'cancelled', icon: Ban },
}

const SEVERITY: Record<string, { label: string; kind: BadgeKind }> = {
  CRITICAL: { label: 'Crítica', kind: 'overdue' },
  HIGH: { label: 'Alta', kind: 'overdue' },
  MEDIUM: { label: 'Média', kind: 'pending' },
  LOW: { label: 'Baixa', kind: 'muted' },
  INFO: { label: 'Info', kind: 'muted' },
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const meta = OUTCOME[outcome]
  if (!meta) return <Badge kind="muted">{outcome}</Badge>
  const Icon = meta.icon
  return (
    <Badge kind={meta.kind} icon={<Icon aria-hidden="true" />}>
      {meta.label}
    </Badge>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const meta = SEVERITY[severity] ?? { label: severity, kind: 'muted' as BadgeKind }
  return (
    <Badge kind={meta.kind} square>
      {meta.label}
    </Badge>
  )
}

function eventIcon(eventType: string): LucideIcon {
  const t = eventType.toUpperCase()
  if (t.includes('PASSWORD')) return KeyRound
  if (t.includes('LOCK')) return Lock
  if (t.includes('ROLE') || t.includes('PERMISSION')) return Shield
  if (t.includes('TOKEN') || t.includes('REFRESH') || t.includes('REAUTH')) return RefreshCcw
  if (t.includes('LOGIN') || t.includes('LOGOUT') || t.includes('OAUTH')) return LogIn
  return ScrollText
}

function EventIcon({ eventType }: { eventType: string }) {
  const Icon = eventIcon(eventType)
  return (
    <span
      className="grid h-8 w-8 flex-none place-items-center rounded-md bg-surface-3 text-fg-muted"
      aria-hidden="true"
    >
      <Icon size={16} />
    </span>
  )
}

function fmtInstant(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortId(id: string | null): string {
  return id ? id.slice(0, 8) + '…' : '—'
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone?: 'overdue' | 'pending'
}) {
  const valueTone = value > 0 && tone ? (tone === 'overdue' ? 'text-overdue' : 'text-pending') : ''
  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
      <span
        className={`grid h-10 w-10 flex-none place-items-center rounded-md ${
          value > 0 && tone === 'overdue'
            ? 'bg-overdue-soft text-overdue'
            : value > 0 && tone === 'pending'
              ? 'bg-pending-soft text-pending'
              : 'bg-surface-3 text-fg-muted'
        }`}
        aria-hidden="true"
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <div className="text-caption text-fg-muted">{label}</div>
        <div className={`font-display text-h2 tabular-nums ${valueTone}`}>{value}</div>
      </div>
    </div>
  )
}

/** Celular/tablet: cada evento vira um card empilhado. */
function AuditCard({ entry }: { entry: AuditLogEntry }) {
  return (
    <li className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <EventIcon eventType={entry.eventType} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 break-all font-mono text-body-sm font-semibold">
            {entry.eventType}
          </span>
          <OutcomeBadge outcome={entry.outcome} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-muted">
          <span className="tabular-nums">{fmtInstant(entry.createdAt)}</span>
          <SeverityBadge severity={entry.severity} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-caption text-fg-subtle">
          <span>
            <span className="sr-only">IP: </span>
            {entry.ipAddressMasked ?? '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <UserRound size={12} aria-hidden="true" />
            <span className="sr-only">Ator: </span>
            {shortId(entry.actorUserId)}
          </span>
        </div>
      </div>
    </li>
  )
}

export default function AuditPage() {
  const [page, setPage] = useState(0)
  const [outcomeSlug, setOutcomeSlug] = useState('')
  const [eventTypeSlug, setEventTypeSlug] = useState('')

  const { data: summary, isLoading: summaryLoading } = useSecuritySummary()

  const {
    data: logs,
    isLoading: logsLoading,
    isError: logsError,
    isFetching,
    refetch,
  } = useAuditLogs({
    page,
    size: PAGE_SIZE,
    outcomeSlug: outcomeSlug || undefined,
    eventTypeSlug: eventTypeSlug || undefined,
  })

  const entries = logs?.content ?? []
  const totalPages = logs?.totalPages ?? 0
  const total = logs?.totalElements ?? 0
  const firstIndex = page * PAGE_SIZE + 1
  const lastIndex = page * PAGE_SIZE + entries.length

  return (
    <div className="max-w-[1280px]">
      <div className="page-h flex-wrap">
        <div className="min-w-0">
          <span className="text-overline uppercase text-fg-subtle">Sistema</span>
          <h1 className="title">Auditoria</h1>
          <div className="desc">Log de eventos de segurança do sistema</div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="ghost"
            className="min-h-touch"
            onClick={() => void refetch()}
            loading={isFetching && !logsLoading}
            leading={<RefreshCcw size={16} aria-hidden="true" />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo de segurança */}
      {summaryLoading ? (
        <SummarySkeleton />
      ) : summary ? (
        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <KpiCard
            icon={Lock}
            label="Contas bloqueadas"
            value={summary.lockedAccountsCount}
            tone="overdue"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Falhas nas últimas 24h"
            value={summary.failedAttemptsLast24h}
            tone="pending"
          />
          <KpiCard
            icon={ShieldAlert}
            label="Re-autenticações forçadas 24h"
            value={summary.forcedReAuthsLast24h}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        {/* Filtros: barra no celular/tablet, painel lateral no desktop largo */}
        <section
          aria-label="Filtros"
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 md:flex-row md:items-end xl:sticky xl:top-4 xl:w-[260px] xl:flex-none xl:flex-col xl:items-stretch"
        >
          <div className="flex flex-col gap-1.5 md:w-[200px] xl:w-auto">
            <label htmlFor="filter-outcome" className="text-caption font-medium text-fg-muted">
              Resultado
            </label>
            <select
              id="filter-outcome"
              className="select"
              value={outcomeSlug}
              onChange={(e) => {
                setOutcomeSlug(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todos</option>
              <option value="SUCCESS">Sucesso</option>
              <option value="FAILURE">Falha</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="filter-event" className="text-caption font-medium text-fg-muted">
              Tipo de evento
            </label>
            <input
              id="filter-event"
              className="input font-mono"
              placeholder="Ex: LOGIN, PASSWORD_CHANGE…"
              autoComplete="off"
              spellCheck={false}
              value={eventTypeSlug}
              onChange={(e) => {
                setEventTypeSlug(e.target.value)
                setPage(0)
              }}
            />
          </div>
          {(outcomeSlug || eventTypeSlug) && (
            <Button
              variant="ghost"
              className="min-h-touch"
              onClick={() => {
                setOutcomeSlug('')
                setEventTypeSlug('')
                setPage(0)
              }}
            >
              Limpar filtros
            </Button>
          )}
        </section>

        {/* Log */}
        <section
          aria-labelledby="audit-events-title"
          className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface-1"
        >
          <div className="flex min-h-[52px] items-center gap-3 border-b border-border px-4">
            <h2 id="audit-events-title" className="m-0 text-body font-semibold">
              Eventos
            </h2>
            {logs && (
              <span className="ml-auto text-caption tabular-nums text-fg-muted">
                {total} evento{total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {logsLoading ? (
            <LogSkeleton />
          ) : logsError ? (
            <div role="alert" className="empty-state">
              <div className="icon !bg-overdue-soft !text-overdue">
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
              <h4>Erro ao carregar log de auditoria.</h4>
              <p>Verifique sua conexão e tente de novo.</p>
              <Button variant="ghost" className="min-h-touch" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <div className="icon">
                <ScrollText size={24} aria-hidden="true" />
              </div>
              <h4>Nenhum evento encontrado.</h4>
              {(outcomeSlug || eventTypeSlug) && <p>Ajuste ou limpe os filtros para ver mais.</p>}
            </div>
          ) : (
            <>
              {/* < 1024: lista de cards */}
              <ul className="m-0 list-none p-0 lg:hidden" aria-label="Eventos de auditoria">
                {entries.map((entry) => (
                  <AuditCard key={entry.id} entry={entry} />
                ))}
              </ul>

              {/* ≥ 1024: tabela densa */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-body-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/60">
                      {['Data · hora', 'Evento', 'Resultado', 'Severidade', 'IP', 'Ator'].map(
                        (h) => (
                          <th
                            key={h}
                            scope="col"
                            className="whitespace-nowrap px-4 py-2.5 text-left text-overline uppercase text-fg-subtle"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border last:border-b-0 hover:bg-surface-2/50"
                      >
                        <td className="whitespace-nowrap px-4 py-2 tabular-nums text-fg-muted">
                          {fmtInstant(entry.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-2.5">
                            <EventIcon eventType={entry.eventType} />
                            <span className="break-all font-mono text-caption font-semibold">
                              {entry.eventType}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <OutcomeBadge outcome={entry.outcome} />
                        </td>
                        <td className="px-4 py-2">
                          <SeverityBadge severity={entry.severity} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-caption text-fg-muted">
                          {entry.ipAddressMasked ?? '—'}
                        </td>
                        <td
                          className="whitespace-nowrap px-4 py-2 font-mono text-caption text-fg-muted"
                          title={entry.actorUserId ?? undefined}
                        >
                          {shortId(entry.actorUserId)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação"
              className="flex items-center justify-between gap-3 border-t border-border px-2 py-2"
            >
              <Button
                variant="ghost"
                size="sm"
                className="min-h-touch"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                leading={<ChevronLeft size={16} aria-hidden="true" />}
                aria-label="Página anterior"
              >
                Anterior
              </Button>
              <span className="text-caption tabular-nums text-fg-muted" aria-live="polite">
                <span className="hidden md:inline">
                  {firstIndex}–{lastIndex} de {total} ·{' '}
                </span>
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-touch"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                trailing={<ChevronRight size={16} aria-hidden="true" />}
                aria-label="Próxima página"
              >
                Próxima
              </Button>
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}

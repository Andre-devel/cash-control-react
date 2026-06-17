import { useState } from 'react'
import { ShieldAlert, Lock, AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BadgeKind } from '@/components/ui/badge'
import { useAuditLogs } from '@/features/audit/hooks/use-audit-logs'
import { useSecuritySummary } from '@/features/audit/hooks/use-security-summary'

function SummarySkeleton() {
  return (
    <div className="grid grid-4 mb-6 animate-pulse" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="kpi">
          <div
            style={{ height: 12, width: 120, background: 'var(--surface-3)', borderRadius: 4 }}
          />
          <div
            style={{
              height: 32,
              width: 80,
              background: 'var(--surface-3)',
              borderRadius: 4,
              marginTop: 8,
            }}
          />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{ height: 40, background: 'var(--surface-2)', borderRadius: 6, marginBottom: 6 }}
        />
      ))}
    </div>
  )
}

function outcomeBadgeKind(outcome: string): BadgeKind {
  if (outcome === 'SUCCESS') return 'paid'
  if (outcome === 'FAILURE') return 'expense'
  if (outcome === 'BLOCKED') return 'cancelled'
  return 'muted'
}

function severityBadgeKind(severity: string): BadgeKind {
  if (severity === 'HIGH' || severity === 'CRITICAL') return 'expense'
  if (severity === 'MEDIUM') return 'pending'
  return 'muted'
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

const PAGE_SIZE = 20

export default function AuditPage() {
  const [page, setPage] = useState(0)
  const [outcomeSlug, setOutcomeSlug] = useState('')
  const [eventTypeSlug, setEventTypeSlug] = useState('')

  const { data: summary, isLoading: summaryLoading } = useSecuritySummary()

  const {
    data: logs,
    isLoading: logsLoading,
    isError: logsError,
    refetch,
  } = useAuditLogs({
    page,
    size: PAGE_SIZE,
    outcomeSlug: outcomeSlug || undefined,
    eventTypeSlug: eventTypeSlug || undefined,
  })

  const entries = logs?.content ?? []
  const totalPages = logs?.totalPages ?? 0

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Auditoria</h1>
          <div className="desc">Log de eventos de segurança do sistema</div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refetch()}
            aria-label="Atualizar"
            title="Atualizar"
          >
            <RefreshCcw size={16} />
          </Button>
        </div>
      </div>

      {/* Security summary */}
      {summaryLoading ? (
        <SummarySkeleton />
      ) : summary ? (
        <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="kpi">
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} aria-hidden="true" />
              Contas bloqueadas
            </div>
            <div
              className="kpi-value"
              style={{ color: summary.lockedAccountsCount > 0 ? 'var(--expense)' : undefined }}
            >
              {summary.lockedAccountsCount}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} aria-hidden="true" />
              Falhas nas últimas 24h
            </div>
            <div
              className="kpi-value"
              style={{ color: summary.failedAttemptsLast24h > 0 ? 'var(--pending)' : undefined }}
            >
              {summary.failedAttemptsLast24h}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={14} aria-hidden="true" />
              Re-autenticações forçadas 24h
            </div>
            <div className="kpi-value">{summary.forcedReAuthsLast24h}</div>
          </div>
        </div>
      ) : null}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-b" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="filter-outcome" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Resultado
            </label>
            <select
              id="filter-outcome"
              className="input"
              style={{ fontSize: 13, minWidth: 140 }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="filter-event" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Tipo de evento
            </label>
            <input
              id="filter-event"
              className="input"
              style={{ fontSize: 13, minWidth: 200 }}
              placeholder="Ex: LOGIN, PASSWORD_CHANGE…"
              value={eventTypeSlug}
              onChange={(e) => {
                setEventTypeSlug(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>
      </div>

      {/* Log table */}
      <div className="card">
        <div className="card-h">
          <h3>Eventos</h3>
          {logs && (
            <div className="sub" style={{ marginLeft: 'auto' }}>
              {logs.totalElements} evento{logs.totalElements !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="card-b" style={{ padding: 0, overflowX: 'auto' }}>
          {logsLoading ? (
            <div style={{ padding: 16 }}>
              <TableSkeleton />
            </div>
          ) : logsError ? (
            <div role="alert" style={{ padding: 16, color: 'var(--expense)', fontSize: 13 }}>
              Erro ao carregar log de auditoria.{' '}
              <button
                type="button"
                onClick={() => void refetch()}
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div
              style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}
            >
              Nenhum evento encontrado.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Evento', 'Resultado', 'Severidade', 'IP', 'Ator'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontWeight: 500,
                        color: 'var(--text-dim)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td
                      style={{
                        padding: '10px 16px',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-dim)',
                      }}
                    >
                      {fmtInstant(entry.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 500,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                      }}
                    >
                      {entry.eventType}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge kind={outcomeBadgeKind(entry.outcome)}>{entry.outcome}</Badge>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge kind={severityBadgeKind(entry.severity)}>{entry.severity}</Badge>
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-dim)',
                      }}
                    >
                      {entry.ipAddressMasked ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-dim)',
                      }}
                    >
                      {entry.actorUserId ? entry.actorUserId.slice(0, 8) + '…' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="card-b"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

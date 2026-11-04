import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ChevronDown, Landmark, RefreshCcw, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRefreshBankConnection } from '@/features/bank-connections/hooks/use-bank-connection-mutations'
import { connectionStatus } from '@/features/bank-connections/utils/connection-status'
import { OrphanItemsSection } from '@/features/bank-sync/components/orphan-items-section'
import {
  BANK_SYNC_QUERY_KEY,
  useBankSyncOverview,
  useBankSyncRuns,
} from '@/features/bank-sync/hooks/use-bank-sync'
import {
  accountsLine,
  connectionLabel,
  describeRun,
  durationLabel,
  OUTCOME,
  relativeDay,
  runTime,
  triggerLabel,
} from '@/features/bank-sync/utils/describe-run'
import type {
  BankSyncConnectionSummary,
  BankSyncOutcome,
  BankSyncRun,
} from '@/features/bank-sync/types'

const PAGE_SIZE = 25
const CARD = 'rounded-xl border border-border bg-surface-1'
const pulse = 'animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none'

const FILTERS: { id: string; label: string; outcomes?: BankSyncOutcome[] }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'problems', label: 'Com problema', outcomes: ['ERROR', 'PARTIAL'] },
  { id: 'success', label: 'Com novidade', outcomes: ['SUCCESS'] },
  { id: 'no-change', label: 'Sem novidade', outcomes: ['NO_CHANGE'] },
  { id: 'gone', label: 'Removidas', outcomes: ['ITEM_GONE'] },
]

function OutcomeBadge({ outcome }: { outcome: BankSyncOutcome }) {
  const meta = OUTCOME[outcome] ?? { label: outcome, kind: 'muted' as const }
  return <Badge kind={meta.kind}>{meta.label}</Badge>
}

export default function BankSyncPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [connectionId, setConnectionId] = useState('')
  const [filterId, setFilterId] = useState('all')
  const filter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0]

  const overview = useBankSyncOverview()
  const runs = useBankSyncRuns({
    page,
    size: PAGE_SIZE,
    connectionId: connectionId || undefined,
    outcome: filter.outcomes,
  })
  const refresh = useRefreshBankConnection()

  function reload() {
    void queryClient.invalidateQueries({ queryKey: BANK_SYNC_QUERY_KEY })
  }

  function syncNow(id: string) {
    // Erro também vira linha no histórico: recarrega nos dois casos.
    refresh.mutate(id, { onSettled: reload })
  }

  const connections = overview.data?.connections ?? []
  const nextPoll = overview.data?.nextScheduledAt
  const labels = new Map(connections.map((c) => [c.connectionId, connectionLabel(c)]))
  const entries = runs.data?.content ?? []
  const total = runs.data?.totalElements ?? 0
  const totalPages = runs.data?.totalPages ?? 0

  return (
    <div className="max-w-[1280px]">
      <div className="page-h flex-wrap">
        <div className="min-w-0">
          <span className="text-overline uppercase text-fg-subtle">Sistema</span>
          <h1 className="title">Sincronização com o banco</h1>
          <div className="desc">
            {nextPoll
              ? `Próxima varredura às ${new Date(nextPoll).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · `
              : ''}
            cada leitura das suas conexões fica guardada por {overview.data?.retentionDays ?? 30}{' '}
            dias
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            variant="ghost"
            className="min-h-touch"
            onClick={reload}
            loading={(overview.isFetching || runs.isFetching) && !runs.isLoading}
            leading={<RefreshCcw size={16} aria-hidden="true" />}
          >
            Atualizar lista
          </Button>
        </div>
      </div>

      {overview.isLoading ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2" aria-busy="true">
          {[1, 2].map((i) => (
            <div key={i} className={`${CARD} h-[188px] p-5`}>
              <div className={`h-4 w-40 ${pulse}`} />
              <div className={`mt-4 h-10 w-full ${pulse}`} />
            </div>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className={`${CARD} empty-state mb-6`}>
          <div className="icon">
            <Landmark size={24} aria-hidden="true" />
          </div>
          <h4>Nenhum banco conectado.</h4>
          <p>Conecte um banco pelo Perfil para ver as sincronizações aqui.</p>
        </div>
      ) : (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {connections.map((connection) => (
            <ConnectionHealth
              key={connection.connectionId}
              connection={connection}
              syncing={refresh.isPending && refresh.variables === connection.connectionId}
              onSync={() => syncNow(connection.connectionId)}
              onFilter={() => {
                setConnectionId(connection.connectionId)
                setPage(0)
              }}
            />
          ))}
        </div>
      )}

      <OrphanItemsSection />

      <section aria-labelledby="bank-sync-history" className={`${CARD} min-w-0 overflow-hidden`}>
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 md:px-5">
          <h2 id="bank-sync-history" className="m-0 flex-1 font-display text-h3 font-bold">
            Histórico
          </h2>
          <label className="flex items-center gap-2 text-caption text-fg-muted">
            Conexão
            <select
              className="select !h-9 !w-auto"
              value={connectionId}
              onChange={(e) => {
                setConnectionId(e.target.value)
                setPage(0)
              }}
            >
              <option value="">Todas</option>
              {connections.map((c) => (
                <option key={c.connectionId} value={c.connectionId}>
                  {labels.get(c.connectionId)}
                </option>
              ))}
            </select>
          </label>
          <div
            role="group"
            aria-label="Resultado"
            className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={f.id === filterId}
                onClick={() => {
                  setFilterId(f.id)
                  setPage(0)
                }}
                className={`min-h-9 whitespace-nowrap rounded-md px-3 text-caption font-semibold ${
                  f.id === filterId ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {runs.isLoading ? (
          <div className="flex flex-col" aria-busy="true" aria-label="Carregando execuções">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b border-border px-5 py-3">
                <div className={`h-4 w-full ${pulse}`} />
              </div>
            ))}
          </div>
        ) : runs.isError ? (
          <div role="alert" className="empty-state">
            <div className="icon !bg-overdue-soft !text-overdue">
              <AlertTriangle size={24} aria-hidden="true" />
            </div>
            <h4>Erro ao carregar o histórico.</h4>
            <Button variant="ghost" className="min-h-touch" onClick={() => void runs.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <RefreshCw size={24} aria-hidden="true" />
            </div>
            <h4>Nenhuma execução encontrada.</h4>
            {(connectionId || filter.outcomes) && <p>Ajuste os filtros para ver mais.</p>}
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="hidden grid-cols-[130px_150px_190px_120px_minmax(0,1fr)_64px_20px] gap-3 border-b border-border px-5 py-2.5 text-overline uppercase text-fg-subtle lg:grid"
            >
              <span>Quando</span>
              <span>Conexão</span>
              <span>Origem</span>
              <span>Resultado</span>
              <span>O que aconteceu</span>
              <span className="text-right">Duração</span>
              <span />
            </div>
            <ul className="m-0 list-none p-0" aria-label="Execuções">
              {entries.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  connection={
                    (run.connectionId && labels.get(run.connectionId)) || run.connectorName || '—'
                  }
                />
              ))}
            </ul>
          </>
        )}

        {total > 0 && (
          <footer className="flex flex-wrap items-center gap-3 px-4 py-3 text-caption text-fg-muted md:px-5">
            <span className="flex-1 tabular-nums">
              Mostrando {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + entries.length} de {total}{' '}
              {total === 1 ? 'execução' : 'execuções'}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-touch"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-touch"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </footer>
        )}
      </section>
    </div>
  )
}

interface ConnectionHealthProps {
  connection: BankSyncConnectionSummary
  syncing: boolean
  onSync: () => void
  onFilter: () => void
}

function ConnectionHealth({ connection, syncing, onSync, onFilter }: ConnectionHealthProps) {
  const status = connectionStatus(connection.status)
  const name = connection.connectorName ?? 'Banco'
  const accounts = accountsLine(connection)
  const lastIsProblem =
    connection.lastRunOutcome === 'ERROR' || connection.lastRunOutcome === 'PARTIAL'
  const note = lastIsProblem
    ? (connection.lastProblemMessage ?? connection.statusDetail ?? 'A última leitura falhou.')
    : connection.lastRunAt
      ? `Última leitura ${relativeDay(connection.lastRunAt)}`
      : 'Ainda sem leituras registradas.'

  return (
    <section
      aria-label={name}
      className={`${CARD} flex flex-col gap-3.5 p-4 md:p-5 ${lastIsProblem ? '!border-overdue/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-9 w-9 flex-none place-items-center rounded-md bg-surface-3 text-fg-muted"
          aria-hidden="true"
        >
          <Landmark size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate font-display text-body font-bold">{name}</h3>
          {accounts && (
            <span className="block truncate font-mono text-caption text-fg">{accounts}</span>
          )}
          <span className="text-caption text-fg-muted">
            {connection.lastSyncedAt
              ? `Banco atualizou na Pluggy ${relativeDay(connection.lastSyncedAt)}`
              : 'O banco ainda não atualizou na Pluggy'}
          </span>
        </div>
        <Badge kind={status.kind}>{status.label}</Badge>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-3 border-y border-border py-3">
        <div className="flex flex-col gap-1">
          <dt className="text-overline uppercase text-fg-subtle">Último sucesso</dt>
          <dd className="m-0 text-body-sm font-semibold">
            {connection.lastSuccessAt ? relativeDay(connection.lastSuccessAt) : '—'}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-overline uppercase text-fg-subtle">Últimas 24 h</dt>
          <dd className="m-0 text-body-sm font-semibold tabular-nums">
            {connection.runsLast24h}
            <span className={connection.problemsLast24h > 0 ? 'text-overdue' : 'text-fg-muted'}>
              {' · '}
              {connection.problemsLast24h > 0
                ? `${connection.problemsLast24h} com problema`
                : 'nenhum problema'}
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-overline uppercase text-fg-subtle">Na fila em 24 h</dt>
          <dd className="m-0 text-body-sm font-semibold tabular-nums">
            {connection.transactionsQueuedLast24h}{' '}
            {connection.transactionsQueuedLast24h === 1 ? 'lançamento' : 'lançamentos'}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`min-w-0 flex-1 basis-48 text-caption ${lastIsProblem ? 'text-overdue' : 'text-fg-muted'}`}
        >
          {note}
        </span>
        <Button variant="link" className="min-h-touch" onClick={onFilter}>
          Ver só esta
        </Button>
        <Button
          variant="primary"
          className="min-h-touch"
          onClick={onSync}
          loading={syncing}
          leading={<RefreshCw size={16} aria-hidden="true" />}
        >
          Sincronizar agora
        </Button>
      </div>
    </section>
  )
}

function RunRow({ run, connection }: { run: BankSyncRun; connection: string }) {
  const [open, setOpen] = useState(false)
  const problem = run.outcome === 'ERROR' || run.outcome === 'PARTIAL'
  const detailId = `run-${run.id}`

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left text-body-sm hover:bg-surface-2/50 md:px-5 lg:min-h-11 lg:grid-cols-[130px_150px_190px_120px_minmax(0,1fr)_64px_20px] lg:py-2"
      >
        <span className="font-mono text-caption tabular-nums text-fg-muted">
          {runTime(run.startedAt)}
        </span>
        <span className="justify-self-end lg:order-none lg:hidden">
          <OutcomeBadge outcome={run.outcome} />
        </span>
        <span className="truncate font-medium">{connection}</span>
        <span className="text-fg-muted lg:text-fg-muted">{triggerLabel(run)}</span>
        <span className="hidden lg:block">
          <OutcomeBadge outcome={run.outcome} />
        </span>
        <span
          className={`col-span-2 min-w-0 lg:col-span-1 lg:truncate ${problem ? 'text-overdue' : 'text-fg-muted'}`}
        >
          {describeRun(run)}
        </span>
        <span className="hidden text-right font-mono text-caption tabular-nums text-fg-muted lg:block">
          {durationLabel(run)}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`hidden text-fg-subtle transition-transform lg:block ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          id={detailId}
          className="mx-4 mb-3 grid grid-cols-2 gap-3 rounded-lg bg-surface-2 p-3 text-caption md:mx-5 lg:ml-[150px] lg:grid-cols-4"
        >
          {run.errorMessage && (
            <p className="col-span-full m-0 break-words font-mono text-overdue">
              {run.errorMessage}
            </p>
          )}
          <Detail label="Status do item" value={run.itemStatus ?? '—'} mono />
          <Detail
            label="Banco atualizou em"
            value={run.itemLastUpdatedAt ? runTime(run.itemLastUpdatedAt) : '—'}
          />
          <Detail label="Contas lidas" value={run.accountsRead ?? '—'} />
          <Detail label="Lançamentos na fila" value={run.transactionsQueued ?? '—'} />
          <Detail
            label="Investimentos"
            value={
              run.investmentsCreated == null
                ? '—'
                : `${run.investmentsCreated} novos · ${run.investmentsRedeemed ?? 0} resgates · ${run.investmentsFailed ?? 0} recusados`
            }
          />
          <Detail label="Duração" value={durationLabel(run)} />
          <Detail label="Item na Pluggy" value={`${run.itemId.slice(0, 8)}…`} mono />
        </div>
      )}
    </li>
  )
}

function Detail({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-fg-muted">{label}</span>
      <span className={`break-words ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

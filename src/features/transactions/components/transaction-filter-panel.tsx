import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  TRANSACTION_FILTER_TYPES,
  TRANSACTION_FILTER_STATUSES,
} from '@/features/transactions/schemas'
import { TRANSACTION_STATUS_LABELS } from '@/features/transactions/utils/transaction-status'
import { PaymentMethodSelect } from '@/features/transactions/components/payment-method-select'
import {
  currentPeriod,
  periodLabel,
  serializePeriod,
  shiftPeriod,
  type TransactionPeriod,
} from '@/features/transactions/utils/period'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import type {
  ListTransactionsParams,
  PaymentMethod,
  TransactionType,
  TransactionStatus,
  PaymentMethodSlug,
} from '@/features/transactions/types'

export const TRANSACTION_FILTER_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
  TRANSFER: 'Transferência',
  MANUAL_ADJUSTMENT: 'Ajuste',
  INVOICE_PAYMENT: 'Pagamento de fatura',
}

/* ────────────────────────────────────────────────────────────────────────────
   Período (mês a mês ou todo o período)
   ──────────────────────────────────────────────────────────────────────────── */

interface PeriodControlProps {
  period: TransactionPeriod
  onPeriodChange: (period: TransactionPeriod) => void
}

export function TransactionPeriodControl({ period, onPeriodChange }: PeriodControlProps) {
  const isCurrentMonth = serializePeriod(period) === serializePeriod(currentPeriod())
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex items-center rounded-full border border-border bg-surface-1 p-0.5"
        role="group"
        aria-label="Período"
      >
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!rounded-full"
          aria-label="Mês anterior"
          disabled={period.kind === 'all'}
          onClick={() => onPeriodChange(shiftPeriod(period, -1))}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </Button>
        <span
          className="min-w-[9.5rem] px-1 text-center text-body font-semibold first-letter:uppercase inline-block"
          aria-live="polite"
        >
          {periodLabel(period)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!rounded-full"
          aria-label="Próximo mês"
          disabled={period.kind === 'all'}
          onClick={() => onPeriodChange(shiftPeriod(period, 1))}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
      <FilterToggleChip
        on={period.kind === 'all'}
        onClick={() => onPeriodChange(period.kind === 'all' ? currentPeriod() : { kind: 'all' })}
      >
        Todo o período
      </FilterToggleChip>
      {period.kind === 'month' && !isCurrentMonth && (
        <FilterToggleChip on={false} onClick={() => onPeriodChange(currentPeriod())}>
          Mês atual
        </FilterToggleChip>
      )}
    </div>
  )
}

function FilterToggleChip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-[36px] rounded-full border px-3 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${
        on
          ? 'border-brand bg-brand/15 text-brand-text'
          : 'border-border-strong bg-transparent text-fg hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Busca (com debounce) + botão de filtros
   ──────────────────────────────────────────────────────────────────────────── */

interface SearchFieldProps {
  searchText: string | undefined
  /** Busca já com debounce; quem chama deve preservar os demais filtros vigentes. */
  onSearchChange: (searchText: string | undefined) => void
}

export function TransactionSearchField({ searchText, onSearchChange }: SearchFieldProps) {
  // A busca tem estado próprio: gravar na URL a cada tecla disparava uma request por letra e,
  // com a resposta chegando fora de ordem, o campo voltava a um valor antigo e perdia letras.
  const appliedSearch = searchText ?? ''
  const [search, setSearch] = useState(appliedSearch)
  const [sentSearch, setSentSearch] = useState(appliedSearch)
  const inputRef = useRef<HTMLInputElement>(null)
  // Mudança vinda de fora (limpar filtros, remover o chip, voltar no histórico) sobrescreve o
  // campo; o eco do que este campo mesmo enviou não, senão as letras digitadas depois se perdem.
  if (appliedSearch !== sentSearch) {
    setSentSearch(appliedSearch)
    setSearch(appliedSearch)
  }

  useEffect(() => {
    if (search === sentSearch) return
    const timer = setTimeout(() => {
      setSentSearch(search)
      onSearchChange(search.trim() ? search : undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, sentSearch, onSearchChange])

  // "/" foca a busca (atalho de teclado no desktop), fora de campos editáveis.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <label className="flex min-h-[46px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 text-fg-muted focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25 lg:min-h-[40px] lg:max-w-[420px]">
      <Search size={16} aria-hidden="true" className="shrink-0" />
      <input
        ref={inputRef}
        type="text"
        enterKeyHint="search"
        placeholder="Buscar por descrição…"
        aria-label="Buscar por descrição"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-[16px] text-fg outline-none placeholder:text-fg-subtle lg:text-body"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <kbd
        aria-hidden="true"
        className="hidden rounded-[6px] border border-border px-1.5 py-0.5 font-mono text-overline lg:inline"
      >
        /
      </kbd>
    </label>
  )
}

export function FiltersButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `Filtros (${count} ativos)` : 'Filtros'}
      className="flex min-h-[46px] shrink-0 items-center gap-2 rounded-lg border border-border-strong bg-surface-1 px-3 text-body font-semibold text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info lg:min-h-[40px]"
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      <span className="hidden md:inline">Filtros</span>
      {count > 0 && <CountPill count={count} />}
    </button>
  )
}

export function CountPill({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold leading-none text-brand-ink"
    >
      {count}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Chips dos filtros ativos
   ──────────────────────────────────────────────────────────────────────────── */

export interface FilterChip {
  key: string
  label: string
  remove: Partial<ListTransactionsParams>
}

/** Um chip por filtro aplicado. O período não entra: ele é a "página" da lista, não um filtro. */
export function buildFilterChips(
  filters: ListTransactionsParams,
  accounts: Account[],
  categories: Category[],
  paymentMethods: PaymentMethod[],
): FilterChip[] {
  const chips: FilterChip[] = []
  if (filters.type) {
    chips.push({
      key: 'type',
      label: `Tipo: ${TRANSACTION_FILTER_TYPE_LABELS[filters.type] ?? filters.type}`,
      remove: { type: undefined },
    })
  }
  if (filters.status) {
    chips.push({
      key: 'status',
      label: `Status: ${TRANSACTION_STATUS_LABELS[filters.status]}`,
      remove: { status: undefined },
    })
  }
  if (filters.accountId) {
    const name = accounts.find((a) => a.id === filters.accountId)?.name ?? 'selecionada'
    chips.push({ key: 'account', label: `Conta: ${name}`, remove: { accountId: undefined } })
  }
  if (filters.categoryId) {
    const name = categories.find((c) => c.id === filters.categoryId)?.name ?? 'selecionada'
    chips.push({
      key: 'category',
      label: `Categoria: ${name}`,
      remove: { categoryId: undefined },
    })
  }
  if (filters.paymentMethod) {
    const name =
      paymentMethods.find((p) => p.slug === filters.paymentMethod)?.name ?? filters.paymentMethod
    chips.push({ key: 'paymentMethod', label: name, remove: { paymentMethod: undefined } })
  }
  if (filters.amountMin || filters.amountMax) {
    const label =
      filters.amountMin && filters.amountMax
        ? `Valor: ${filters.amountMin} a ${filters.amountMax}`
        : filters.amountMin
          ? `Valor ≥ ${filters.amountMin}`
          : `Valor ≤ ${filters.amountMax}`
    chips.push({ key: 'amount', label, remove: { amountMin: undefined, amountMax: undefined } })
  }
  if (filters.searchText) {
    chips.push({
      key: 'search',
      label: `Busca: “${filters.searchText}”`,
      remove: { searchText: undefined },
    })
  }
  if (filters.includeCancelled) {
    chips.push({
      key: 'cancelled',
      label: 'Inclui cancelados',
      remove: { includeCancelled: false },
    })
  }
  return chips
}

interface ActiveFilterChipsProps {
  chips: FilterChip[]
  onRemove: (chip: FilterChip) => void
  /** No celular a fileira rola na horizontal; nas telas maiores ela quebra linha. */
  scroll?: boolean
}

export function ActiveFilterChips({ chips, onRemove, scroll = false }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null
  return (
    <ul
      aria-label="Filtros ativos"
      className={`flex gap-1.5 ${
        scroll ? '-mx-4 overflow-x-auto px-4 [scrollbar-width:none]' : 'flex-wrap'
      }`}
    >
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="inline-flex shrink-0 items-center rounded-full bg-brand-soft pl-3 text-body-sm font-medium text-brand-text"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remover filtro ${chip.label}`}
            onClick={() => onRemove(chip)}
            className="grid size-8 place-items-center rounded-full hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Campos de filtro — os mesmos no painel lateral (desktop) e no sheet (celular/tablet)
   ──────────────────────────────────────────────────────────────────────────── */

interface TransactionFilterFieldsProps {
  filters: ListTransactionsParams
  accounts: Account[]
  /** Lista achatada (raízes + subcategorias) — ver `flattenCategories`. */
  categories: Category[]
  includeCancelled: boolean
  onFiltersChange: (filters: ListTransactionsParams) => void
  onToggleIncludeCancelled: () => void
}

function FieldLabel({ children }: { children: string }) {
  return <span className="text-caption font-medium text-fg-muted">{children}</span>
}

export function TransactionFilterFields({
  filters,
  accounts,
  categories,
  includeCancelled,
  onFiltersChange,
  onToggleIncludeCancelled,
}: TransactionFilterFieldsProps) {
  function update(patch: Partial<ListTransactionsParams>) {
    onFiltersChange({ ...filters, ...patch, page: 0 })
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <FieldLabel>Conta</FieldLabel>
        <Select
          aria-label="Filtrar por conta"
          value={filters.accountId ?? ''}
          className={filters.accountId ? 'on !border-brand' : undefined}
          onChange={(e) => update({ accountId: e.target.value || undefined })}
        >
          <option value="">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <FieldLabel>Tipo</FieldLabel>
        <Select
          aria-label="Filtrar por tipo"
          value={filters.type ?? ''}
          className={filters.type ? 'on !border-brand' : undefined}
          onChange={(e) => update({ type: (e.target.value as TransactionType) || undefined })}
        >
          <option value="">Todos os tipos</option>
          {TRANSACTION_FILTER_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_FILTER_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <FieldLabel>Status</FieldLabel>
        <Select
          aria-label="Filtrar por status"
          value={filters.status ?? ''}
          className={filters.status ? 'on !border-brand' : undefined}
          onChange={(e) => update({ status: (e.target.value as TransactionStatus) || undefined })}
        >
          <option value="">Todos os status</option>
          {TRANSACTION_FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TRANSACTION_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <FieldLabel>Forma de pagamento</FieldLabel>
        <PaymentMethodSelect
          aria-label="Filtrar por forma de pagamento"
          value={filters.paymentMethod ?? ''}
          onChange={(value) => update({ paymentMethod: (value as PaymentMethodSlug) || undefined })}
          allowAll="Todas as formas"
          className={filters.paymentMethod ? 'on !border-brand' : undefined}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <FieldLabel>Categoria</FieldLabel>
        <Select
          aria-label="Filtrar por categoria"
          value={filters.categoryId ?? ''}
          className={filters.categoryId ? 'on !border-brand' : undefined}
          onChange={(e) => update({ categoryId: e.target.value || undefined })}
        >
          <option value="">Todas (inclui subcategorias)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? '↳ ' : ''}
              {c.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex min-h-touch cursor-pointer items-center justify-between gap-3 border-t border-border pt-3 text-body-sm font-medium">
        Incluir cancelados
        <input
          type="checkbox"
          className="checkbox"
          checked={includeCancelled}
          onChange={onToggleIncludeCancelled}
        />
      </label>
    </div>
  )
}

import { INVOICE_FILTER_LABELS, type InvoiceFilter } from '@/features/invoices/utils/invoice-status'

const FILTERS: InvoiceFilter[] = ['all', 'open', 'paid']

interface InvoiceFilterTabsProps {
  value: InvoiceFilter
  onChange: (value: InvoiceFilter) => void
  className?: string
}

/** Segmentado Todas / Em aberto / Pagas. Filtra a página já carregada, no cliente. */
export function InvoiceFilterTabs({ value, onChange, className = '' }: InvoiceFilterTabsProps) {
  return (
    <div className={`segmented ${className}`} role="group" aria-label="Filtrar faturas">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          className={value === filter ? 'on' : undefined}
          aria-pressed={value === filter}
          onClick={() => onChange(filter)}
        >
          {INVOICE_FILTER_LABELS[filter]}
        </button>
      ))}
    </div>
  )
}

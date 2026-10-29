import { FileDown, Pencil, RefreshCw } from 'lucide-react'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Money } from '@/components/ui/money'
import type { InvoiceItem } from '@/features/invoices/types'
import { formatLocalDate } from '@/lib/format-date'
import { installmentLabel, originalDescriptionOf } from '@/features/invoices/utils/invoice-item'

const CHIP =
  'inline-flex items-center gap-1 rounded-[6px] px-1.5 py-[3px] font-mono text-[11px] leading-none'

interface InvoiceItemMarksProps {
  item: InvoiceItem
  /** A parcela já tem coluna própria na tabela; nos cards ela vira selo. */
  showInstallment?: boolean
}

/** Selos do item: parcela `n/m`, rotativo e importado. Cada um com texto, não só cor. */
export function InvoiceItemMarks({ item, showInstallment = true }: InvoiceItemMarksProps) {
  const installment = showInstallment ? installmentLabel(item) : null
  if (!installment && !item.isRevolving && !item.imported) return null
  return (
    <span className="flex flex-wrap gap-1">
      {installment && (
        <span className={`${CHIP} bg-surface-3 text-fg`} aria-label={`Parcela ${installment}`}>
          {installment}
        </span>
      )}
      {item.isRevolving && (
        <span className={`${CHIP} bg-pending-soft text-pending`}>
          <RefreshCw size={11} aria-hidden="true" />
          rotativo
        </span>
      )}
      {item.imported && (
        <span className={`${CHIP} bg-info-soft text-info`}>
          <FileDown size={11} aria-hidden="true" />
          importado
        </span>
      )}
    </span>
  )
}

interface InvoiceItemRowProps {
  item: InvoiceItem
  /** Nome exibido da categoria (subcategoria quando houver). */
  categoryLabel: string
  /** Cor da categoria para a bolha do ícone. */
  categoryColor?: string
  onEdit?: (item: InvoiceItem) => void
}

/**
 * Item de fatura em formato de card (celular/tablet): descrição, original do arquivo,
 * data · categoria, selos e valor. Com `onEdit`, a linha ganha o botão de editar.
 */
export function InvoiceItemRow({
  item,
  categoryLabel,
  categoryColor,
  onEdit,
}: InvoiceItemRowProps) {
  const original = originalDescriptionOf(item)
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <IconBubble
        color={categoryColor ?? 'var(--text-muted)'}
        size="sm"
        glyph={(categoryLabel || item.description)[0]?.toUpperCase() ?? '·'}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-medium leading-tight">{item.description}</span>
        {original && (
          <span
            className="truncate font-mono text-[11px] leading-tight text-fg-subtle"
            title={original}
          >
            {original}
          </span>
        )}
        <span className="text-caption text-fg-muted">
          {formatLocalDate(item.competenceDate)} · {categoryLabel}
        </span>
        <InvoiceItemMarks item={item} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="pt-0.5 text-body font-semibold tabular-nums">
          <Money value={parseFloat(item.amount)} />
        </span>
        {onEdit && (
          <button
            type="button"
            className="btn btn-ghost btn-icon min-h-touch min-w-touch"
            aria-label={`Editar lançamento ${item.description}`}
            onClick={() => onEdit(item)}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useMerchantScope } from '@/features/invoices/hooks/use-merchant-scope'
import { useUpdateInvoiceItem } from '@/features/invoices/hooks/use-update-invoice-item'
import type { InvoiceItem } from '@/features/invoices/types'
import { installmentLabel } from '@/features/invoices/utils/invoice-item'
import { formatLocalDate } from '@/lib/format-date'

interface EditInvoiceItemDialogProps {
  item: InvoiceItem | null
  open: boolean
  onClose: () => void
}

export function EditInvoiceItemDialog({ item, open, onClose }: EditInvoiceItemDialogProps) {
  const { data: categories } = useCategories()
  const { data: scope } = useMerchantScope(open ? (item?.id ?? null) : null)
  const { mutate: updateItem, isPending } = useUpdateInvoiceItem()

  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  // Desmarcado: gravar o padrão muda as próximas importações, e isso tem de ser escolha.
  const [rememberMerchant, setRememberMerchant] = useState(false)
  const [applyToHistory, setApplyToHistory] = useState(false)

  // Reabre os campos a cada item novo — o diálogo é montado uma vez pela página e reusado.
  useEffect(() => {
    if (open && item) {
      setDescription(item.description)
      setCategoryId(item.categoryId)
      setRememberMerchant(false)
      setApplyToHistory(false)
    }
  }, [open, item])

  if (!open || !item) return null

  const original = item.originalDescription
  const showsOriginal = Boolean(original) && original !== description
  const relatedCount = scope?.relatedItemCount ?? 0
  const installment = installmentLabel(item)

  function handleClose() {
    onClose()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!item) return
    updateItem(
      {
        itemId: item.id,
        data: {
          description: description.trim(),
          categoryId,
          subcategoryId: null,
          // Lançamento manual não tem estabelecimento do PDF para virar padrão.
          rememberMerchant: item.imported && rememberMerchant,
          applyToHistory,
        },
      },
      { onSuccess: handleClose },
    )
  }

  return (
    <Modal
      panel
      title="Editar lançamento"
      subtitle={item.imported ? 'Importado da fatura' : 'Lançado manualmente'}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-invoice-item-form"
            variant="primary"
            disabled={!description.trim()}
            loading={isPending}
          >
            {isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="edit-invoice-item-form" onSubmit={handleSubmit} noValidate className="col gap-4">
        {/* Contexto do item: o texto do arquivo (quando importado), data, parcela e valor. */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-2 p-3">
          <span className="text-caption text-fg-muted">
            {item.imported ? 'Descrição original (do PDF)' : 'Lançado manualmente'}
          </span>
          {item.imported && original && (
            <span className="break-all font-mono text-body-sm" title={original}>
              {original}
            </span>
          )}
          <span className="text-caption text-fg-muted tabular-nums">
            {formatLocalDate(item.competenceDate)}
            {installment ? ` · parcela ${installment}` : ''}
            {item.isRevolving ? ' · rotativo' : ''} · <Money value={parseFloat(item.amount)} />
          </span>
        </div>

        <Field label="Descrição" required>
          <Input
            value={description}
            maxLength={255}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {showsOriginal && (
          <div className="-mt-2 flex flex-wrap items-center gap-x-2 text-caption text-fg-subtle">
            <span>Difere do arquivo.</span>
            <button
              type="button"
              onClick={() => setDescription(original ?? '')}
              className="min-h-touch cursor-pointer border-0 bg-transparent p-0 text-caption font-semibold text-brand-text underline"
            >
              usar original
            </button>
          </div>
        )}

        <Field label="Categoria">
          <CategoryCombobox
            variant="field"
            value={categoryId}
            categories={categories ?? []}
            emptyLabel="Sem categoria"
            onChange={setCategoryId}
          />
        </Field>

        {item.imported && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-2 p-3">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              checked={rememberMerchant}
              onChange={(e) => setRememberMerchant(e.target.checked)}
            />
            <span className="text-body-sm">
              <strong>Gravar como padrão deste estabelecimento</strong>
              <span className="mt-0.5 block text-caption text-fg-muted">
                A próxima importação já vem com esta descrição pré-preenchida.
              </span>
            </span>
          </label>
        )}

        {relatedCount > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-2 p-3">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              checked={applyToHistory}
              onChange={(e) => setApplyToHistory(e.target.checked)}
            />
            <span className="text-body-sm">
              <strong>
                Aplicar aos outros {relatedCount}{' '}
                {relatedCount === 1 ? 'lançamento' : 'lançamentos'} deste estabelecimento
              </strong>
              <span className="mt-0.5 block text-caption text-fg-muted">
                Corrige a descrição e a categoria em todas as faturas, não só nesta.
              </span>
            </span>
          </label>
        )}
      </form>
    </Modal>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useMerchantScope } from '@/features/invoices/hooks/use-merchant-scope'
import { useUpdateInvoiceItem } from '@/features/invoices/hooks/use-update-invoice-item'
import type { InvoiceItem } from '@/features/invoices/types'

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
  const [rememberMerchant, setRememberMerchant] = useState(true)
  const [applyToHistory, setApplyToHistory] = useState(false)

  // Reabre os campos a cada item novo — o diálogo é montado uma vez pela página e reusado.
  useEffect(() => {
    if (open && item) {
      setDescription(item.description)
      setCategoryId(item.categoryId)
      setRememberMerchant(true)
      setApplyToHistory(false)
    }
  }, [open, item])

  if (!open || !item) return null

  const original = item.originalDescription
  const showsOriginal = Boolean(original) && original !== description
  const relatedCount = scope?.relatedItemCount ?? 0

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
          rememberMerchant,
          applyToHistory,
        },
      },
      { onSuccess: handleClose },
    )
  }

  return (
    <Modal
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
            disabled={isPending || !description.trim()}
            aria-busy={isPending}
          >
            {isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="edit-invoice-item-form" onSubmit={handleSubmit} noValidate className="col gap-4">
        <Field label="Descrição" required>
          <Input
            value={description}
            maxLength={255}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {showsOriginal && (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: -12 }}>
            No arquivo: <span title={original ?? undefined}>{original}</span>
            <button
              type="button"
              onClick={() => setDescription(original ?? '')}
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                marginLeft: 6,
                font: 'inherit',
                color: 'var(--primary)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
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

        <label
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '10px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-3)',
            background: 'var(--surface-2)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={rememberMerchant}
            onChange={(e) => setRememberMerchant(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13 }}>
            <strong>Gravar como padrão deste estabelecimento</strong>
            <span
              style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}
            >
              A próxima importação já vem com esta descrição pré-preenchida.
            </span>
          </span>
        </label>

        {relatedCount > 0 && (
          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-3)',
              background: 'var(--surface-2)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={applyToHistory}
              onChange={(e) => setApplyToHistory(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13 }}>
              <strong>
                Aplicar aos outros {relatedCount}{' '}
                {relatedCount === 1 ? 'lançamento' : 'lançamentos'} deste estabelecimento
              </strong>
              <span
                style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}
              >
                Corrige a descrição e a categoria em todas as faturas, não só nesta.
              </span>
            </span>
          </label>
        )}
      </form>
    </Modal>
  )
}

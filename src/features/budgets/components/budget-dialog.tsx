import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { MoneyInput } from '@/components/ui/money-input'
import { Select } from '@/components/ui/select'
import { useDeleteBudget, useSaveBudget } from '@/features/budgets/hooks/use-budget-mutations'
import {
  budgetSchema,
  type BudgetFormInput,
  type BudgetFormValues,
} from '@/features/budgets/schemas/budget.schema'
import type { BudgetItem } from '@/features/budgets/types'
import type { CategoryGroup } from '@/features/categories/utils/category-groups'
import { formatYearMonth } from '@/lib/format-date'
import { formatMoneyInput } from '@/lib/money'

/** `item` ausente = novo orçamento, com a escolha da categoria. */
export type BudgetDialogState = { item?: BudgetItem } | null

interface BudgetDialogProps {
  state: BudgetDialogState
  /** Mês aberto na página (`aaaa-mm`): é o mês do "só neste mês". */
  month: string
  /** Categorias que podem receber um teto novo (as que já têm ficam de fora). */
  groups: CategoryGroup[]
  onClose: () => void
}

export function BudgetDialog({ state, month, groups, onClose }: BudgetDialogProps) {
  const { mutate: save, isPending: saving } = useSaveBudget()
  const { mutate: remove, isPending: removing } = useDeleteBudget()
  const item = state?.item
  const form = useForm<BudgetFormInput, unknown, BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    values: state
      ? {
          categoryId: item?.categoryId ?? '',
          amount: item ? formatMoneyInput(item.budget) : '',
          scope: item?.source ?? 'DEFAULT',
        }
      : undefined,
  })

  if (!state) return null

  const monthLabel = formatYearMonth(month)
  const errors = form.formState.errors

  function onSubmit(values: BudgetFormValues) {
    const monthOnly = values.scope === 'MONTH'
    save(
      {
        categoryId: values.categoryId,
        data: { amount: values.amount, month: monthOnly ? month : null },
        clearMonth: !monthOnly && item?.source === 'MONTH' ? month : undefined,
      },
      { onSuccess: onClose },
    )
  }

  // Remove o teto de onde ele veio: o ajuste do mês volta ao padrão; o padrão some de vez.
  function onRemove() {
    if (!item) return
    remove(
      { categoryId: item.categoryId, month: item.source === 'MONTH' ? month : null },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      title={item ? 'Editar orçamento' : 'Novo orçamento'}
      subtitle={item?.name}
      onClose={onClose}
      footer={
        <>
          {item && (
            <Button type="button" variant="ghost" onClick={onRemove} disabled={saving || removing}>
              {item.source === 'MONTH' ? 'Voltar ao valor de todo mês' : 'Remover orçamento'}
            </Button>
          )}
          <div className="spacer" />
          <Button type="submit" form="budget-form" variant="primary" loading={saving}>
            Salvar
          </Button>
        </>
      }
    >
      <form
        id="budget-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        {!item && (
          <Field label="Categoria" htmlFor="budget-category" error={errors.categoryId?.message}>
            <Select
              id="budget-category"
              error={!!errors.categoryId}
              {...form.register('categoryId')}
            >
              <option value="">Escolha…</option>
              {groups.map(({ root, children }) => (
                <optgroup key={root.id} label={root.name}>
                  <option value={root.id}>{root.name} (tudo)</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        )}
        <Field
          label="Teto do mês"
          htmlFor="budget-amount"
          hint="Compras no cartão contam no mês da compra."
          error={errors.amount?.message}
        >
          <MoneyInput id="budget-amount" placeholder="ex: 1.200,00" {...form.register('amount')} />
        </Field>
        <fieldset className="col gap-2">
          <legend className="mb-1 text-body-sm font-semibold text-fg">Vale para</legend>
          <label className="flex min-h-touch items-center gap-2 text-body-sm">
            <input type="radio" value="DEFAULT" {...form.register('scope')} />
            Todo mês
          </label>
          <label className="flex min-h-touch items-center gap-2 text-body-sm">
            <input type="radio" value="MONTH" {...form.register('scope')} />
            Só em {monthLabel}
          </label>
        </fieldset>
      </form>
    </Modal>
  )
}

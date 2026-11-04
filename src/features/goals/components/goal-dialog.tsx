import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { MoneyInput } from '@/components/ui/money-input'
import { Select } from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { CategoryColorPicker } from '@/features/categories/components/category-color-picker'
import { IconPicker } from '@/features/categories/components/icon-picker'
import { DEFAULT_CATEGORY_COLOR } from '@/features/categories/utils/category-colors'
import {
  useCreateGoal,
  useDeleteGoal,
  useUpdateGoal,
} from '@/features/goals/hooks/use-goal-mutations'
import {
  goalSchema,
  type GoalFormInput,
  type GoalFormValues,
} from '@/features/goals/schemas/goal.schema'
import type { SaveGoalRequest, SavingsGoal } from '@/features/goals/types'
import { useHoldings } from '@/features/investments/hooks/use-investments'
import { formatMoneyInput } from '@/lib/money'

/** `goal` ausente = nova meta. */
export type GoalDialogState = { goal?: SavingsGoal } | null

interface GoalDialogProps {
  state: GoalDialogState
  onClose: () => void
}

const DEFAULT_ICON = 'savings'

function linkOf(goal?: SavingsGoal): string {
  if (goal?.accountId) return `account:${goal.accountId}`
  if (goal?.holdingId) return `holding:${goal.holdingId}`
  return ''
}

function toRequest(values: GoalFormValues): SaveGoalRequest {
  const [kind, id] = values.link.split(':')
  return {
    name: values.name,
    targetAmount: values.targetAmount,
    targetDate: values.targetDate || null,
    accountId: kind === 'account' ? id : null,
    holdingId: kind === 'holding' ? id : null,
    icon: values.icon || null,
    color: values.color || null,
  }
}

export function GoalDialog({ state, onClose }: GoalDialogProps) {
  const { mutate: create, isPending: creating } = useCreateGoal()
  const { mutate: update, isPending: updating } = useUpdateGoal()
  const { mutate: remove, isPending: removing } = useDeleteGoal()
  const { data: accounts } = useAccounts()
  const { data: holdings } = useHoldings('ACTIVE')
  const goal = state?.goal
  const form = useForm<GoalFormInput, unknown, GoalFormValues>({
    resolver: zodResolver(goalSchema),
    values: state
      ? {
          name: goal?.name ?? '',
          targetAmount: goal ? formatMoneyInput(goal.targetAmount) : '',
          targetDate: goal?.targetDate ?? '',
          link: linkOf(goal),
          icon: goal?.icon ?? DEFAULT_ICON,
          color: goal?.color ?? DEFAULT_CATEGORY_COLOR,
        }
      : undefined,
  })

  if (!state) return null

  const errors = form.formState.errors
  const saving = creating || updating
  const activeAccounts = (accounts ?? []).filter((a) => !a.archivedAt)
  // Vínculo a uma conta arquivada ou aplicação resgatada continua no select: sem ele,
  // salvar outra mudança apagaria o vínculo sem a pessoa perceber.
  const currentLink = linkOf(goal)
  const knownLinks = new Set([
    ...activeAccounts.map((a) => `account:${a.id}`),
    ...(holdings ?? []).map((h) => `holding:${h.id}`),
  ])
  // Meta com progresso é arquivada pela API; sem progresso, é apagada.
  const archives = (goal?.current ?? 0) > 0

  function onSubmit(values: GoalFormValues) {
    const data = toRequest(values)
    if (goal) update({ id: goal.id, data }, { onSuccess: onClose })
    else create(data, { onSuccess: onClose })
  }

  function onRemove() {
    if (!goal) return
    remove({ id: goal.id, archives }, { onSuccess: onClose })
  }

  return (
    <Modal
      title={goal ? 'Editar meta' : 'Nova meta'}
      subtitle={goal?.name}
      onClose={onClose}
      footer={
        <>
          {goal ? (
            <Button type="button" variant="ghost" onClick={onRemove} disabled={saving || removing}>
              {archives ? 'Arquivar meta' : 'Excluir meta'}
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <div className="spacer" />
          <Button type="submit" form="goal-form" variant="primary" loading={saving}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="col gap-4">
        <Field label="Nome" htmlFor="goal-name" error={errors.name?.message}>
          <Input
            id="goal-name"
            placeholder="ex: Reserva de emergência"
            maxLength={100}
            error={!!errors.name}
            {...form.register('name')}
          />
        </Field>
        <Field label="Valor da meta" htmlFor="goal-amount" error={errors.targetAmount?.message}>
          <MoneyInput
            id="goal-amount"
            placeholder="ex: 20.000,00"
            error={!!errors.targetAmount}
            {...form.register('targetAmount')}
          />
        </Field>
        <Field
          label="Prazo (opcional)"
          htmlFor="goal-date"
          hint="Com prazo, mostramos quanto guardar por mês."
        >
          <Input id="goal-date" type="date" {...form.register('targetDate')} />
        </Field>
        <Field
          label="Acompanhar pelo saldo de (opcional)"
          htmlFor="goal-link"
          hint="O progresso é o saldo da conta ou o valor líquido da aplicação."
        >
          <Select id="goal-link" {...form.register('link')}>
            <option value="">Nenhum vínculo</option>
            {currentLink && !knownLinks.has(currentLink) && (
              <option value={currentLink}>Vínculo atual</option>
            )}
            {activeAccounts.length > 0 && (
              <optgroup label="Contas">
                {activeAccounts.map((a) => (
                  <option key={a.id} value={`account:${a.id}`}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            )}
            {(holdings ?? []).length > 0 && (
              <optgroup label="Aplicações">
                {(holdings ?? []).map((h) => (
                  <option key={h.id} value={`holding:${h.id}`}>
                    {h.name} · {h.accountName}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
        <Field label="Cor">
          <CategoryColorPicker
            value={form.watch('color') || DEFAULT_CATEGORY_COLOR}
            onChange={(v) => form.setValue('color', v)}
          />
        </Field>
        <Field label="Ícone">
          <IconPicker value={form.watch('icon') ?? ''} onChange={(v) => form.setValue('icon', v)} />
        </Field>
      </form>
    </Modal>
  )
}

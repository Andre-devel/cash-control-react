import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { MoneyInput } from '@/components/ui/money-input'
import { useSetManualValue } from '@/features/investments/hooks/use-holding-mutations'
import {
  manualValueSchema,
  type ManualValueFormInput,
  type ManualValueFormValues,
} from '@/features/investments/schemas/redeem.schema'
import type { FixedIncomeHolding } from '@/features/investments/types'
import { localIsoDate } from '@/lib/local-date'
import { formatMoneyInput } from '@/lib/money'

interface ManualValueDialogProps {
  holding: FixedIncomeHolding | null
  onClose: () => void
}

export function ManualValueDialog({ holding, onClose }: ManualValueDialogProps) {
  const { mutate: save, isPending } = useSetManualValue()
  const form = useForm<ManualValueFormInput, unknown, ManualValueFormValues>({
    resolver: zodResolver(manualValueSchema),
    values: holding
      ? {
          value: holding.manualValue === null ? '' : formatMoneyInput(holding.manualValue),
          date: holding.manualValueDate ?? localIsoDate(),
        }
      : undefined,
  })

  if (!holding) return null

  function onSubmit(values: ManualValueFormValues) {
    save({ id: holding!.id, data: values }, { onSuccess: () => onClose() })
  }

  function clear() {
    save({ id: holding!.id, data: { value: null, date: null } }, { onSuccess: () => onClose() })
  }

  return (
    <Modal
      title="Valor do banco"
      subtitle={holding.name}
      onClose={onClose}
      footer={
        <>
          {holding.manualValue !== null && (
            <Button type="button" variant="ghost" onClick={clear} disabled={isPending}>
              Voltar ao calculado
            </Button>
          )}
          <div className="spacer" />
          <Button type="submit" form="manual-value-form" variant="primary" loading={isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <form
        id="manual-value-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <p className="text-body-sm text-fg-muted">
          Informe o valor bruto que o app do banco mostra. O rendimento passa a ser calculado a
          partir dele.
        </p>
        <Field label="Valor bruto" error={form.formState.errors.value?.message}>
          <MoneyInput placeholder="ex: 1.052,37" {...form.register('value')} />
        </Field>
        <Field label="Data" error={form.formState.errors.date?.message}>
          <Input
            type="date"
            min={holding.appliedAt}
            max={localIsoDate()}
            {...form.register('date')}
          />
        </Field>
      </form>
    </Modal>
  )
}

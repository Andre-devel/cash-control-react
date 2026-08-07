import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { MoneyInput } from '@/components/ui/money-input'
import { useUpdateInstallment } from '@/features/installments/hooks/use-update-installment'
import { useInstallmentSeriesDetail } from '@/features/installments/hooks/use-installment-series-detail'
import { moneyField } from '@/lib/money'
import type { InstallmentSeries } from '@/features/installments/types'

const editInstallmentSchema = z.object({
  transactionId: z.string().min(1, 'Selecione a parcela'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: moneyField('Valor deve ser um decimal válido (ex: 300,00)'),
  competenceDate: z.string().min(1, 'Data de vencimento é obrigatória'),
})

type EditInstallmentFormValues = z.infer<typeof editInstallmentSchema>

const DEFAULT_VALUES: EditInstallmentFormValues = {
  transactionId: '',
  description: '',
  amount: '0.00',
  competenceDate: new Date().toISOString().split('T')[0],
}

interface EditInstallmentDialogProps {
  series: InstallmentSeries | null
  open: boolean
  onClose: () => void
}

export function EditInstallmentDialog({ series, open, onClose }: EditInstallmentDialogProps) {
  const { mutate: updateInstallment, isPending } = useUpdateInstallment()
  const { data: detail, isLoading: loadingDetail } = useInstallmentSeriesDetail(
    open ? series?.id : null,
  )

  const form = useForm<EditInstallmentFormValues>({
    resolver: zodResolver(editInstallmentSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const installments = detail?.installments ?? []

  /** Ao escolher a parcela, traz os valores atuais dela para o formulário. */
  function handleSelectInstallment(transactionId: string) {
    form.setValue('transactionId', transactionId)
    const selected = installments.find((i) => i.id === transactionId)
    if (!selected) return
    form.setValue('description', selected.description)
    form.setValue('amount', selected.amount)
    form.setValue('competenceDate', selected.competenceDate)
  }

  function onSubmit(data: EditInstallmentFormValues) {
    const { transactionId, ...rest } = data
    updateInstallment(
      { transactionId, data: rest },
      {
        onSuccess: () => {
          form.reset(DEFAULT_VALUES)
          onClose()
        },
      },
    )
  }

  function handleClose() {
    form.reset(DEFAULT_VALUES)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Editar parcela individual"
      subtitle={`Substituição individual — aplica-se apenas a esta parcela, não à série inteira${series ? ` "${series.description}"` : ''}.`}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-installment-form"
            variant="primary"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                />
                Salvando…
              </>
            ) : (
              'Salvar parcela'
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-installment-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Parcela" required error={form.formState.errors.transactionId?.message}>
          <Select
            aria-label="Parcela"
            disabled={loadingDetail}
            value={form.watch('transactionId')}
            onChange={(e) => handleSelectInstallment(e.target.value)}
          >
            <option value="">{loadingDetail ? 'Carregando…' : 'Selecionar parcela'}</option>
            {installments.map((installment) => (
              <option key={installment.id} value={installment.id}>
                {installment.installmentNumber
                  ? `Parcela ${installment.installmentNumber}`
                  : installment.description}
                {' — '}
                {new Date(installment.competenceDate).toLocaleDateString()}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Descrição" error={form.formState.errors.description?.message}>
          <Input placeholder="ex: Notebook novo — parcela 3" {...form.register('description')} />
        </Field>

        <Field label="Valor" error={form.formState.errors.amount?.message}>
          <MoneyInput placeholder="ex: 300,00" {...form.register('amount')} />
        </Field>

        <Field label="Data de vencimento" error={form.formState.errors.competenceDate?.message}>
          <Input type="date" {...form.register('competenceDate')} />
        </Field>
      </form>
    </Modal>
  )
}

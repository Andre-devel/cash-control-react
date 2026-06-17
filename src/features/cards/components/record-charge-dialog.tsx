import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import {
  recordChargeSchema,
  type RecordChargeFormValues,
} from '@/features/cards/schemas/record-charge.schema'
import { useRecordCharge } from '@/features/cards/hooks/use-record-charge'

const DEFAULT_VALUES: RecordChargeFormValues = {
  description: '',
  amount: '0.00',
  categoryId: '',
  date: '',
}

interface RecordChargeDialogProps {
  cardId: string
  open: boolean
  onClose: () => void
}

export function RecordChargeDialog({ cardId, open, onClose }: RecordChargeDialogProps) {
  const { mutate: recordCharge, isPending } = useRecordCharge(cardId)

  const form = useForm<RecordChargeFormValues>({
    resolver: zodResolver(recordChargeSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: RecordChargeFormValues) {
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    recordCharge(payload, {
      onSuccess: () => {
        form.reset(DEFAULT_VALUES)
        onClose()
      },
    })
  }

  function handleClose() {
    form.reset(DEFAULT_VALUES)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Registrar cobrança"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="record-charge-form"
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
                Registrando…
              </>
            ) : (
              'Registrar'
            )}
          </Button>
        </>
      }
    >
      <form
        id="record-charge-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Descrição" error={form.formState.errors.description?.message}>
          <Input placeholder="ex: Supermercado" {...form.register('description')} />
        </Field>

        <Field label="Valor" error={form.formState.errors.amount?.message}>
          <Input placeholder="ex: 150.00" {...form.register('amount')} />
        </Field>

        <Field label="Data" error={form.formState.errors.date?.message}>
          <Input type="date" {...form.register('date')} />
        </Field>

        <Field label="Categoria (opcional)" error={form.formState.errors.categoryId?.message}>
          <Input placeholder="UUID da categoria" {...form.register('categoryId')} />
        </Field>
      </form>
    </Modal>
  )
}

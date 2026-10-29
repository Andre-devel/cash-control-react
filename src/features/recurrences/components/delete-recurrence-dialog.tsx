import { useForm } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  deleteRecurrenceSchema,
  DELETE_RECURRENCE_STRATEGIES,
  type DeleteRecurrenceFormValues,
} from '@/features/recurrences/schemas/delete-recurrence.schema'
import { useDeleteRecurrence } from '@/features/recurrences/hooks/use-delete-recurrence'
import type { Recurrence } from '@/features/recurrences/types'

const STRATEGY_LABELS: Record<string, string> = {
  FUTURE_ONLY: 'Somente futuras — cancelar as ocorrências em aberto a partir de hoje',
  ALL: 'Todas em aberto — cancelar também as pendentes de datas passadas',
}

interface DeleteRecurrenceDialogProps {
  recurrence: Recurrence | null
  open: boolean
  onClose: () => void
}

export function DeleteRecurrenceDialog({ recurrence, open, onClose }: DeleteRecurrenceDialogProps) {
  const { mutate: deleteRecurrence, isPending } = useDeleteRecurrence()

  const form = useForm<DeleteRecurrenceFormValues>({
    resolver: zodResolver(deleteRecurrenceSchema),
    defaultValues: { strategy: 'FUTURE_ONLY' },
  })

  function onSubmit(data: DeleteRecurrenceFormValues) {
    if (!recurrence) return
    deleteRecurrence(
      { id: recurrence.id, strategy: data.strategy },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        },
      },
    )
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      alert
      title="Excluir regra de recorrência"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="submit" form="delete-recurrence-form" variant="danger" loading={isPending}>
            {isPending ? 'Excluindo…' : 'Excluir regra'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-md bg-overdue-soft text-overdue"
        >
          <Trash2 size={20} />
        </span>
        <p className="text-body-sm text-fg-muted">
          Você está prestes a excluir a regra{' '}
          <strong className="text-fg">{recurrence?.description}</strong>. Escolha como as transações
          existentes devem ser tratadas.
        </p>
      </div>

      <div
        className="mt-3 flex flex-col gap-2 rounded-lg bg-surface-2 px-4 py-3 text-body-sm text-fg-muted"
        role="note"
      >
        <p>
          <span className="font-semibold text-fg">Somente futuras:</span> as ocorrências pendentes a
          partir de hoje ficam canceladas; as anteriores continuam como estão.
        </p>
        <p>
          <span className="font-semibold text-fg">Todas em aberto:</span> cancela também as
          pendentes ou vencidas de datas passadas.
        </p>
        <p>
          Em ambos os casos as ocorrências pagas são mantidas e as canceladas continuam no histórico
          (opção &quot;Incluir cancelados&quot; em Transações). A regra deixa de gerar novas
          ocorrências.
        </p>
      </div>

      <form
        id="delete-recurrence-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="mt-4 flex flex-col gap-4"
      >
        <Field label="Estratégia de exclusão" error={form.formState.errors.strategy?.message}>
          <Select aria-label="Estratégia de exclusão" {...form.register('strategy')}>
            {DELETE_RECURRENCE_STRATEGIES.map((strategy) => (
              <option key={strategy} value={strategy}>
                {STRATEGY_LABELS[strategy]}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  )
}

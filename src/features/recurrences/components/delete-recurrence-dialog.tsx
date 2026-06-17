import { useForm } from 'react-hook-form'
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
  FUTURE_ONLY: 'Somente futuras — manter transações passadas, excluir apenas as futuras',
  ALL: 'Todas — excluir todas as transações geradas por esta regra',
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
      title="Excluir regra de recorrência"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="delete-recurrence-form"
            variant="danger"
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
                Excluindo…
              </>
            ) : (
              'Excluir regra'
            )}
          </Button>
        </>
      }
    >
      <p>
        Você está prestes a excluir a regra <strong>{recurrence?.description}</strong>. Escolha como
        as transações existentes devem ser tratadas.
      </p>

      <div
        className="rounded space-y-2 text-sm"
        role="note"
        style={{
          marginTop: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-3)',
          padding: '12px 16px',
        }}
      >
        <p>
          <span className="font-medium">Somente futuras:</span> As transações já registradas são
          mantidas. Apenas as transações futuras que ainda não foram geradas serão removidas.
        </p>
        <p>
          <span className="font-medium">Todas:</span> Todas as transações geradas por esta regra —
          passadas e futuras — serão excluídas permanentemente. Esta ação não pode ser desfeita.
        </p>
      </div>

      <form
        id="delete-recurrence-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
        style={{ marginTop: 12 }}
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

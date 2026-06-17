import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import {
  updateRecurrenceSchema,
  type UpdateRecurrenceFormValues,
} from '@/features/recurrences/schemas/update-recurrence.schema'
import { useUpdateRecurrence } from '@/features/recurrences/hooks/use-update-recurrence'
import type { Recurrence } from '@/features/recurrences/types'

interface EditRecurrenceDialogProps {
  recurrence: Recurrence | null
  open: boolean
  onClose: () => void
}

export function EditRecurrenceDialog({ recurrence, open, onClose }: EditRecurrenceDialogProps) {
  const { mutate: updateRecurrence, isPending } = useUpdateRecurrence()

  const form = useForm<UpdateRecurrenceFormValues>({
    resolver: zodResolver(updateRecurrenceSchema),
    defaultValues: {
      description: '',
      amount: '0.00',
      accountId: '',
      categoryId: '',
    },
  })

  useEffect(() => {
    if (recurrence) {
      form.reset({
        description: recurrence.description,
        amount: recurrence.amount,
        accountId: recurrence.accountId,
        categoryId: recurrence.categoryId ?? '',
      })
    }
  }, [recurrence, form])

  function onSubmit(data: UpdateRecurrenceFormValues) {
    if (!recurrence) return
    const payload = {
      ...data,
      categoryId: data.categoryId || undefined,
    }
    updateRecurrence(
      { id: recurrence.id, data: payload },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  function handleClose() {
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Editar regra de recorrência"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-recurrence-form"
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
              'Salvar alterações'
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-recurrence-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Descrição" error={form.formState.errors.description?.message}>
          <Input placeholder="ex: Aluguel mensal" {...form.register('description')} />
        </Field>

        <Field label="Valor" error={form.formState.errors.amount?.message}>
          <Input placeholder="ex: 1500.00" {...form.register('amount')} />
        </Field>

        <Field label="ID da conta" error={form.formState.errors.accountId?.message}>
          <Input placeholder="UUID da conta" {...form.register('accountId')} />
        </Field>

        <Field label="ID da categoria (opcional)" error={form.formState.errors.categoryId?.message}>
          <Input placeholder="UUID da categoria" {...form.register('categoryId')} />
        </Field>
      </form>
    </Modal>
  )
}

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createCardSchema,
  CARD_BRANDS,
  type CreateCardFormValues,
} from '@/features/cards/schemas/create-card.schema'
import { useUpdateCard } from '@/features/cards/hooks/use-update-card'
import type { Card } from '@/features/cards/types'

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'Amex',
  HIPERCARD: 'Hipercard',
  OTHER: 'Outro',
}

interface EditCardDialogProps {
  card: Card | null
  open: boolean
  onClose: () => void
}

export function EditCardDialog({ card, open, onClose }: EditCardDialogProps) {
  const { mutate: updateCard, isPending } = useUpdateCard()

  const form = useForm<CreateCardFormValues>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      name: '',
      brand: 'VISA',
      creditLimit: '0.00',
      closingDay: 1,
      dueDay: 10,
    },
  })

  useEffect(() => {
    if (card) {
      form.reset({
        name: card.name,
        brand: card.brand,
        creditLimit: card.creditLimit,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
      })
    }
  }, [card, form])

  function onSubmit(data: CreateCardFormValues) {
    if (!card) return
    updateCard(
      { id: card.id, data },
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
      title="Editar cartão de crédito"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-card-form"
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
        id="edit-card-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input placeholder="ex: Nubank" {...form.register('name')} />
        </Field>

        <Field label="Bandeira" error={form.formState.errors.brand?.message}>
          <Select aria-label="Bandeira" {...form.register('brand')}>
            {CARD_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {BRAND_LABELS[brand]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Limite de crédito" error={form.formState.errors.creditLimit?.message}>
          <Input placeholder="ex: 5000.00" {...form.register('creditLimit')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Dia de fechamento" error={form.formState.errors.closingDay?.message}>
            <Input
              type="number"
              min={1}
              max={31}
              {...form.register('closingDay', { valueAsNumber: true })}
            />
          </Field>

          <Field label="Dia de vencimento" error={form.formState.errors.dueDay?.message}>
            <Input
              type="number"
              min={1}
              max={31}
              {...form.register('dueDay', { valueAsNumber: true })}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

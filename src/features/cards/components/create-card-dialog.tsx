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
import { useCreateCard } from '@/features/cards/hooks/use-create-card'
import { setFormErrors } from '@/lib/form-errors'

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'Amex',
  HIPERCARD: 'Hipercard',
  OTHER: 'Outro',
}

const DEFAULT_VALUES: CreateCardFormValues = {
  name: '',
  brand: 'VISA',
  creditLimit: '0.00',
  closingDay: 1,
  dueDay: 10,
}

interface CreateCardDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateCardDialog({ open, onClose }: CreateCardDialogProps) {
  const form = useForm<CreateCardFormValues>({
    resolver: zodResolver(createCardSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { mutate: createCard, isPending } = useCreateCard({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  function onSubmit(data: CreateCardFormValues) {
    createCard(data, {
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
      title="Novo cartão de crédito"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-card-form"
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
                Criando…
              </>
            ) : (
              'Criar cartão'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-card-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}
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
              placeholder="ex: 1"
              {...form.register('closingDay', { valueAsNumber: true })}
            />
          </Field>

          <Field label="Dia de vencimento" error={form.formState.errors.dueDay?.message}>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="ex: 10"
              {...form.register('dueDay', { valueAsNumber: true })}
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

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
  OTHER: 'Other',
}

const DEFAULT_VALUES: CreateCardFormValues = {
  name: '',
  brand: 'VISA',
  lastFourDigits: '',
  creditLimit: '0.00',
  closingDay: 1,
  dueDay: 10,
  color: '#820AD1',
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
      title="Create Credit Card"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
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
                Creating…
              </>
            ) : (
              'Create Card'
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
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input placeholder="e.g. Nubank" {...form.register('name')} />
        </Field>

        <Field label="Brand" error={form.formState.errors.brand?.message}>
          <Select aria-label="Brand" {...form.register('brand')}>
            {CARD_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {BRAND_LABELS[brand]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Last Four Digits" error={form.formState.errors.lastFourDigits?.message}>
          <Input placeholder="e.g. 1234" maxLength={4} {...form.register('lastFourDigits')} />
        </Field>

        <Field label="Credit Limit" error={form.formState.errors.creditLimit?.message}>
          <Input placeholder="e.g. 5000.00" {...form.register('creditLimit')} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Closing Day" error={form.formState.errors.closingDay?.message}>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 1"
              {...form.register('closingDay', { valueAsNumber: true })}
            />
          </Field>

          <Field label="Due Day" error={form.formState.errors.dueDay?.message}>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 10"
              {...form.register('dueDay', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field label="Color" error={form.formState.errors.color?.message}>
          <Input type="color" className="h-10 w-full cursor-pointer" {...form.register('color')} />
        </Field>
      </form>
    </Modal>
  )
}

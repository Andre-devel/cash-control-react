import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  createCardSchema,
  CARD_BRANDS,
  type CreateCardFormValues,
} from '@/features/cards/schemas/create-card.schema'
import { useCreateCard } from '@/features/cards/hooks/use-create-card'
import { NativeSelect } from './card-form-fields'

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
  billingCycleDay: 1,
  dueDay: 10,
  color: '#820AD1',
}

interface CreateCardDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateCardDialog({ open, onClose }: CreateCardDialogProps) {
  const { mutate: createCard, isPending } = useCreateCard()

  const form = useForm<CreateCardFormValues>({
    resolver: zodResolver(createCardSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: CreateCardFormValues) {
    createCard(data, {
      onSuccess: () => {
        form.reset(DEFAULT_VALUES)
        onClose()
      },
    })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset(DEFAULT_VALUES)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Credit Card</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="create-card-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nubank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Brand" {...field}>
                      {CARD_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>
                          {BRAND_LABELS[brand]}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastFourDigits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Four Digits</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1234" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 5000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingCycleDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="e.g. 1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Day</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="e.g. 10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input type="color" className="h-10 w-full cursor-pointer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-card-form" disabled={isPending} aria-busy={isPending}>
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Creating…
              </>
            ) : (
              'Create Card'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

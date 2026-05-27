import { useEffect } from 'react'
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
import { useUpdateCard } from '@/features/cards/hooks/use-update-card'
import { NativeSelect } from './card-form-fields'
import type { Card } from '@/features/cards/types'

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'Amex',
  HIPERCARD: 'Hipercard',
  OTHER: 'Other',
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
      lastFourDigits: '',
      creditLimit: '0.00',
      billingCycleDay: 1,
      dueDay: 10,
      color: '#820AD1',
    },
  })

  useEffect(() => {
    if (card) {
      form.reset({
        name: card.name,
        brand: card.brand,
        lastFourDigits: card.lastFourDigits,
        creditLimit: card.creditLimit,
        billingCycleDay: card.billingCycleDay,
        dueDay: card.dueDay,
        color: card.color,
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Credit Card</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-card-form"
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
          <Button type="submit" form="edit-card-form" disabled={isPending} aria-busy={isPending}>
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

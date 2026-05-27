import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  adjustBalanceSchema,
  type AdjustBalanceFormValues,
} from '@/features/accounts/schemas/adjust-balance.schema'
import { useAdjustBalance } from '@/features/accounts/hooks/use-adjust-balance'
import type { Account } from '@/features/accounts/types'

interface AdjustBalanceDialogProps {
  account: Account | null
  open: boolean
  onClose: () => void
}

export function AdjustBalanceDialog({ account, open, onClose }: AdjustBalanceDialogProps) {
  const { mutate: adjustBalance, isPending } = useAdjustBalance()

  const form = useForm<AdjustBalanceFormValues>({
    resolver: zodResolver(adjustBalanceSchema),
    defaultValues: {
      targetBalance: account?.balance ?? '0.00',
      note: '',
    },
  })

  function onSubmit(data: AdjustBalanceFormValues) {
    if (!account) return
    adjustBalance(
      { id: account.id, data },
      {
        onSuccess: () => {
          form.reset()
          onClose()
        },
      },
    )
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Balance — {account?.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="adjust-balance-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="targetBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Balance</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 2500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Reconciliation with bank statement" {...field} />
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
          <Button
            type="submit"
            form="adjust-balance-form"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Adjusting…
              </>
            ) : (
              'Adjust Balance'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

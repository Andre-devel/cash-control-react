import { useState } from 'react'
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
  DialogDescription,
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
  createCategorizationRuleSchema,
  type CreateCategorizationRuleFormValues,
} from '@/features/categories/schemas/create-categorization-rule.schema'
import { useCategorizationRules } from '@/features/categories/hooks/use-categorization-rules'
import { useCreateCategorizationRule } from '@/features/categories/hooks/use-create-categorization-rule'
import { useDeleteCategorizationRule } from '@/features/categories/hooks/use-delete-categorization-rule'
import { NativeSelect } from '@/features/accounts/components/account-form-fields'
import type { Category, CategorizationRule } from '@/features/categories/types'

interface DeleteRuleDialogProps {
  rule: CategorizationRule | null
  open: boolean
  onClose: () => void
}

function DeleteRuleDialog({ rule, open, onClose }: DeleteRuleDialogProps) {
  const { mutate: deleteRule, isPending } = useDeleteCategorizationRule()

  function handleConfirm() {
    if (!rule) return
    deleteRule(rule.id, { onSuccess: () => onClose() })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Rule</DialogTitle>
          <DialogDescription>
            Delete the auto-categorization rule for pattern{' '}
            <span className="font-semibold">"{rule?.pattern}"</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Deleting…
              </>
            ) : (
              'Delete Rule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CreateRuleDialogProps {
  open: boolean
  onClose: () => void
  categories: Category[]
}

function CreateRuleDialog({ open, onClose, categories }: CreateRuleDialogProps) {
  const { mutate: createRule, isPending } = useCreateCategorizationRule()

  const form = useForm<CreateCategorizationRuleFormValues>({
    resolver: zodResolver(createCategorizationRuleSchema),
    defaultValues: { pattern: '', categoryId: '' },
  })

  function onSubmit(data: CreateCategorizationRuleFormValues) {
    createRule(data, {
      onSuccess: () => {
        form.reset({ pattern: '', categoryId: '' })
        onClose()
      },
    })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset({ pattern: '', categoryId: '' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Auto-Categorization Rule</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="create-rule-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Supermarket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <NativeSelect aria-label="Category" {...field}>
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </NativeSelect>
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
          <Button type="submit" form="create-rule-form" disabled={isPending} aria-busy={isPending}>
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Creating…
              </>
            ) : (
              'Create Rule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CategorizationRulesSectionProps {
  categories: Category[]
}

export function CategorizationRulesSection({ categories }: CategorizationRulesSectionProps) {
  const { data: rules, isLoading } = useCategorizationRules()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategorizationRule | null>(null)

  return (
    <section aria-label="Auto-categorization rules">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-lg font-semibold">Auto-Categorization Rules</h2>
        <Button
          size="sm"
          className="min-h-[44px]"
          onClick={() => setCreateOpen(true)}
          aria-label="New Rule"
        >
          New Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading rules">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : !rules || rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No auto-categorization rules defined.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="flex-1 font-mono">{rule.pattern}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">
                {rule.category?.name ?? rule.categoryId}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive min-h-[44px] sm:min-h-0"
                onClick={() => setDeleteTarget(rule)}
                aria-label={`Delete rule for ${rule.pattern}`}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <CreateRuleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
      />

      <DeleteRuleDialog
        rule={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  )
}

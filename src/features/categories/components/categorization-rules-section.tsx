import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createCategorizationRuleSchema,
  type CreateCategorizationRuleFormValues,
} from '@/features/categories/schemas/create-categorization-rule.schema'
import { useCategorizationRules } from '@/features/categories/hooks/use-categorization-rules'
import { useCreateCategorizationRule } from '@/features/categories/hooks/use-create-categorization-rule'
import { useDeleteCategorizationRule } from '@/features/categories/hooks/use-delete-categorization-rule'
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

  if (!open) return null

  return (
    <Modal
      title="Delete Rule"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
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
                Deleting…
              </>
            ) : (
              'Delete Rule'
            )}
          </Button>
        </>
      }
    >
      <p>
        Delete the auto-categorization rule for pattern <strong>"{rule?.pattern}"</strong>? This
        action cannot be undone.
      </p>
    </Modal>
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

  function handleClose() {
    form.reset({ pattern: '', categoryId: '' })
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Create Auto-Categorization Rule"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-rule-form"
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
              'Create Rule'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-rule-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Pattern" error={form.formState.errors.pattern?.message}>
          <Input placeholder="e.g. Supermarket" {...form.register('pattern')} />
        </Field>
        <Field label="Category" error={form.formState.errors.categoryId?.message}>
          <Select aria-label="Category" {...form.register('categoryId')}>
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
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

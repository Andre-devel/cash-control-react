import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import type { Account } from '@/features/accounts/types'
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
  accounts: Account[]
}

function CreateRuleDialog({ open, onClose, categories, accounts }: CreateRuleDialogProps) {
  const { mutate: createRule, isPending } = useCreateCategorizationRule()

  const form = useForm<CreateCategorizationRuleFormValues>({
    resolver: zodResolver(createCategorizationRuleSchema),
    defaultValues: { pattern: '', categoryId: '', subcategoryId: '', accountId: '' },
  })

  const watchedCategoryId = form.watch('categoryId')
  const selectedCategory = categories.find((c) => c.id === watchedCategoryId)
  const subcategories = selectedCategory?.subcategories ?? []

  function onSubmit(data: CreateCategorizationRuleFormValues) {
    const payload = {
      ...data,
      subcategoryId: data.subcategoryId || undefined,
      accountId: data.accountId || undefined,
    }
    createRule(payload, {
      onSuccess: () => {
        form.reset({ pattern: '', categoryId: '', subcategoryId: '', accountId: '' })
        onClose()
      },
    })
  }

  function handleClose() {
    form.reset({ pattern: '', categoryId: '', subcategoryId: '', accountId: '' })
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
            {flattenCategories(categories).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Field>

        {subcategories.length > 0 && (
          <Field
            label="Subcategory (optional)"
            error={form.formState.errors.subcategoryId?.message}
          >
            <Select aria-label="Subcategory" {...form.register('subcategoryId')}>
              <option value="">None</option>
              {subcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {accounts.length > 0 && (
          <Field
            label="Scope to Account (optional)"
            error={form.formState.errors.accountId?.message}
          >
            <Select aria-label="Account" {...form.register('accountId')}>
              <option value="">All accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </form>
    </Modal>
  )
}

interface CategorizationRulesSectionProps {
  categories: Category[]
  accounts: Account[]
}

export function CategorizationRulesSection({
  categories,
  accounts,
}: CategorizationRulesSectionProps) {
  const { data: rules, isLoading } = useCategorizationRules()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategorizationRule | null>(null)

  const sortedRules = rules ? [...rules].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)) : []

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Regras de Categorização Automática</h3>
          <div className="sub">Padrões de texto para categorizar transações automaticamente</div>
        </div>
        <div className="right">
          <Button
            variant="primary"
            size="sm"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
            aria-label="New Rule"
          >
            Nova regra
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div
          className="card-b"
          aria-busy="true"
          aria-label="Loading rules"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{ height: 36, borderRadius: 6, background: 'var(--surface-3)' }}
            />
          ))}
        </div>
      ) : !sortedRules.length ? (
        <div className="card-b">
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Nenhuma regra de categorização automática definida.
          </p>
        </div>
      ) : (
        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Padrão</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {sortedRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="mono">{rule.pattern}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {rule.category?.name ?? rule.categoryId}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {rule.priority != null ? rule.priority : '—'}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(rule)}
                      aria-label={`Delete rule for ${rule.pattern}`}
                      style={{ color: 'var(--expense)' }}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateRuleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        accounts={accounts}
      />

      <DeleteRuleDialog
        rule={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

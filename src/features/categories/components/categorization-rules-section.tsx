import { useState } from 'react'
import { ArrowRight, Landmark, Plus, Trash2 } from 'lucide-react'
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
import { CategoryBubble } from '@/features/categories/components/category-bubble'
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
      alert
      title="Excluir regra"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="button" variant="danger" loading={isPending} onClick={handleConfirm}>
            {isPending ? 'Excluindo…' : 'Excluir regra'}
          </Button>
        </>
      }
    >
      <p>
        Excluir a regra de categorização automática para o padrão <strong>"{rule?.pattern}"</strong>
        ? Esta ação não pode ser desfeita.
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
      title="Nova regra de categorização automática"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="submit" form="create-rule-form" variant="primary" loading={isPending}>
            {isPending ? 'Criando…' : 'Criar regra'}
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
        <Field label="Padrão" error={form.formState.errors.pattern?.message}>
          <Input placeholder="ex: Supermercado" {...form.register('pattern')} />
        </Field>

        <Field label="Categoria" error={form.formState.errors.categoryId?.message}>
          <Select aria-label="Categoria" {...form.register('categoryId')}>
            <option value="">Selecionar categoria</option>
            {flattenCategories(categories).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Field>

        {subcategories.length > 0 && (
          <Field
            label="Subcategoria (opcional)"
            error={form.formState.errors.subcategoryId?.message}
          >
            <Select aria-label="Subcategoria" {...form.register('subcategoryId')}>
              <option value="">Nenhuma</option>
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
            label="Restringir à conta (opcional)"
            error={form.formState.errors.accountId?.message}
          >
            <Select aria-label="Conta" {...form.register('accountId')}>
              <option value="">Todas as contas</option>
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

function RulesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando regras" className="flex flex-col gap-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-[68px] animate-pulse rounded-lg border border-border bg-surface-1 motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

export function CategorizationRulesSection({
  categories,
  accounts,
}: CategorizationRulesSectionProps) {
  const { data: rules, isLoading } = useCategorizationRules()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategorizationRule | null>(null)

  const sortedRules = rules ? [...rules].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)) : []
  const byId = new Map(flattenCategories(categories).map((c) => [c.id, c]))
  const accountName = new Map(accounts.map((a) => [a.id, a.name]))

  return (
    <section className="flex flex-col gap-3" aria-labelledby="rules-title">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="rules-title" className="font-display text-h2 text-fg">
            Regras de categorização automática
          </h2>
          <p className="m-0 text-body-sm text-fg-muted">
            Quando a descrição de um lançamento contém o padrão, a categoria é sugerida
            automaticamente. Aplicadas de cima para baixo; a primeira que casar vence.
          </p>
        </div>
        <Button
          variant="primary"
          leading={<Plus size={16} aria-hidden="true" />}
          onClick={() => setCreateOpen(true)}
        >
          Nova regra
        </Button>
      </div>

      {isLoading ? (
        <RulesSkeleton />
      ) : !sortedRules.length ? (
        <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-body-sm text-fg-muted">
          Nenhuma regra de categorização automática definida.
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {sortedRules.map((rule, index) => {
            const category = byId.get(rule.categoryId) ?? rule.category
            const sub = rule.subcategoryId ? byId.get(rule.subcategoryId) : undefined
            const target = sub ?? category
            const restrictedTo = rule.accountId
              ? (accountName.get(rule.accountId) ?? 'uma conta')
              : null
            return (
              <li
                key={rule.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 py-3 pl-3 pr-1.5"
              >
                <span
                  className="w-5 shrink-0 text-center font-mono text-caption font-semibold text-fg-muted"
                  aria-label={`Prioridade ${index + 1}`}
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="break-words font-mono text-body-sm font-medium text-fg">
                    contém “{rule.pattern}”
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 text-body-sm font-medium text-fg">
                    <ArrowRight size={14} className="shrink-0 text-fg-muted" aria-hidden="true" />
                    <CategoryBubble color={target?.color} icon={target?.icon} size="xs" />
                    <span className="truncate">
                      {sub && category
                        ? `${category.name} › ${sub.name}`
                        : (category?.name ?? rule.categoryId)}
                    </span>
                  </span>
                  {restrictedTo && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-xs bg-surface-2 px-2 py-1 text-[11px] font-medium leading-none text-fg-muted">
                      <Landmark size={12} aria-hidden="true" />
                      só {restrictedTo}
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-touch min-w-touch shrink-0 text-fg-muted"
                  onClick={() => setDeleteTarget(rule)}
                  aria-label={`Excluir regra ${rule.pattern}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </li>
            )
          })}
        </ol>
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
    </section>
  )
}

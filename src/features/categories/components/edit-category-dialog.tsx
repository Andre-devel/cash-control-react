import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import {
  createCategorySchema,
  CATEGORY_TYPES,
  type CreateCategoryFormValues,
} from '@/features/categories/schemas/create-category.schema'
import { useUpdateCategory } from '@/features/categories/hooks/use-update-category'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import type { Category } from '@/features/categories/types'

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
}

interface EditCategoryDialogProps {
  category: Category | null
  open: boolean
  onClose: () => void
}

export function EditCategoryDialog({ category, open, onClose }: EditCategoryDialogProps) {
  const { mutate: updateCategory, isPending } = useUpdateCategory()
  const { data: categories } = useCategories()

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      color: '#4CAF50',
      icon: 'tag',
      type: 'EXPENSE',
      parentId: undefined,
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color,
        icon: category.icon,
        type: category.type,
        parentId: category.parentId ?? undefined,
      })
    }
  }, [category, form])

  function onSubmit(data: CreateCategoryFormValues) {
    if (!category) return
    const payload = {
      ...data,
      parentId: data.parentId === '' ? undefined : data.parentId,
    }
    updateCategory(
      { id: category.id, data: payload },
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

  const rootCategories = (categories ?? []).filter(
    (c) => !c.archived && !c.isSystem && c.id !== category?.id,
  )
  const allFlatCategories = flattenCategories(rootCategories).filter((c) => c.id !== category?.id)

  if (!open) return null

  return (
    <Modal
      title="Edit Category"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="edit-category-form"
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
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-category-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="col gap-4"
      >
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input placeholder="e.g. Food" {...form.register('name')} />
        </Field>

        <Field label="Type" error={form.formState.errors.type?.message}>
          <Select aria-label="Type" {...form.register('type')}>
            {CATEGORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {CATEGORY_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Color" error={form.formState.errors.color?.message}>
          <Input placeholder="#4CAF50" {...form.register('color')} />
        </Field>

        <Field label="Icon" error={form.formState.errors.icon?.message}>
          <Input placeholder="e.g. tag" {...form.register('icon')} />
        </Field>

        <Field label="Parent Category (optional)" error={form.formState.errors.parentId?.message}>
          <Select aria-label="Parent Category" {...form.register('parentId')}>
            <option value="">None</option>
            {allFlatCategories.map((cat) => (
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

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
import { useCreateCategory } from '@/features/categories/hooks/use-create-category'
import { useCategories } from '@/features/categories/hooks/use-categories'

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
}

const DEFAULT_VALUES: CreateCategoryFormValues = {
  name: '',
  color: '#4CAF50',
  icon: 'tag',
  type: 'EXPENSE',
  parentId: undefined,
}

interface CreateCategoryDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateCategoryDialog({ open, onClose }: CreateCategoryDialogProps) {
  const { mutate: createCategory, isPending } = useCreateCategory()
  const { data: categories } = useCategories()

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(data: CreateCategoryFormValues) {
    const payload = {
      ...data,
      parentId: data.parentId === '' ? undefined : data.parentId,
    }
    createCategory(payload, {
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

  const rootCategories = (categories ?? []).filter((c) => c.parentId === null && !c.archived)

  if (!open) return null

  return (
    <Modal
      title="Create Category"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="create-category-form"
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
              'Create Category'
            )}
          </Button>
        </>
      }
    >
      <form
        id="create-category-form"
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

        {rootCategories.length > 0 && (
          <Field label="Parent Category (optional)" error={form.formState.errors.parentId?.message}>
            <Select aria-label="Parent Category" {...form.register('parentId')}>
              <option value="">None</option>
              {rootCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </form>
    </Modal>
  )
}

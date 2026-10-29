import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { CategoryColorPicker } from '@/features/categories/components/category-color-picker'
import { CategoryPreview } from '@/features/categories/components/category-preview'
import { DEFAULT_CATEGORY_COLOR } from '@/features/categories/utils/category-colors'
import { IconPicker } from '@/features/categories/components/icon-picker'
import {
  createCategorySchema,
  type CreateCategoryFormValues,
} from '@/features/categories/schemas/create-category.schema'
import { useUpdateCategory } from '@/features/categories/hooks/use-update-category'
import { useCategories } from '@/features/categories/hooks/use-categories'
import type { Category } from '@/features/categories/types'
import { setFormErrors } from '@/lib/form-errors'

interface EditCategoryDialogProps {
  category: Category | null
  open: boolean
  onClose: () => void
}

export function EditCategoryDialog({ category, open, onClose }: EditCategoryDialogProps) {
  const { data: categories } = useCategories()

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      color: DEFAULT_CATEGORY_COLOR,
      icon: 'tag',
      parentId: undefined,
    },
  })
  const { mutate: updateCategory, isPending } = useUpdateCategory({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color,
        icon: category.icon,
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

  const parentOptions = (categories ?? []).filter(
    (c) => !c.isArchived && c.parentId == null && c.id !== category?.id,
  )

  if (!open) return null

  return (
    <Modal
      title="Editar categoria"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="submit" form="edit-category-form" variant="primary" loading={isPending}>
            {isPending ? 'Salvando…' : 'Salvar alterações'}
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
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}
        <CategoryPreview
          name={form.watch('name') ?? ''}
          color={form.watch('color') || DEFAULT_CATEGORY_COLOR}
          icon={form.watch('icon') ?? ''}
        />

        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input placeholder="ex: Alimentação" {...form.register('name')} />
        </Field>

        <Field label="Cor" error={form.formState.errors.color?.message}>
          <CategoryColorPicker
            value={form.watch('color') || DEFAULT_CATEGORY_COLOR}
            onChange={(v) => form.setValue('color', v, { shouldValidate: true })}
          />
        </Field>

        <Field label="Ícone" error={form.formState.errors.icon?.message}>
          <IconPicker
            value={form.watch('icon') ?? ''}
            onChange={(v) => form.setValue('icon', v, { shouldValidate: true })}
          />
        </Field>

        <Field label="Categoria pai (opcional)" error={form.formState.errors.parentId?.message}>
          <select className="input" aria-label="Categoria pai" {...form.register('parentId')}>
            <option value="">Nenhuma</option>
            {parentOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { ColorPicker } from '@/components/ui/color-picker'
import { IconPicker } from '@/features/categories/components/icon-picker'
import {
  createCategorySchema,
  type CreateCategoryFormValues,
} from '@/features/categories/schemas/create-category.schema'
import { useCreateCategory } from '@/features/categories/hooks/use-create-category'
import { setFormErrors } from '@/lib/form-errors'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'

const DEFAULT_VALUES: CreateCategoryFormValues = {
  name: '',
  color: '#4CAF50',
  icon: 'tag',
  parentId: undefined,
}

interface CreateCategoryDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateCategoryDialog({ open, onClose }: CreateCategoryDialogProps) {
  const { data: categories } = useCategories()

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { mutate: createCategory, isPending } = useCreateCategory({
    onFieldError: (error) => setFormErrors(error, form.setError),
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

  const rootCategories = (categories ?? []).filter((c) => !c.isArchived && !c.isDefault)
  const allFlatCategories = flattenCategories(rootCategories)

  if (!open) return null

  return (
    <Modal
      title="Nova categoria"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
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
                Criando…
              </>
            ) : (
              'Criar categoria'
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
        {form.formState.errors.root && (
          <div role="alert" className="err">
            {form.formState.errors.root.message}
          </div>
        )}
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input placeholder="ex: Alimentação" {...form.register('name')} />
        </Field>

        <Field label="Cor" error={form.formState.errors.color?.message}>
          <ColorPicker
            value={form.watch('color') ?? '#4CAF50'}
            onChange={(v) => form.setValue('color', v, { shouldValidate: true })}
          />
        </Field>

        <Field label="Ícone" error={form.formState.errors.icon?.message}>
          <IconPicker
            value={form.watch('icon') ?? ''}
            onChange={(v) => form.setValue('icon', v, { shouldValidate: true })}
            color={form.watch('color') ?? '#4CAF50'}
          />
        </Field>

        {allFlatCategories.length > 0 && (
          <Field label="Categoria pai (opcional)" error={form.formState.errors.parentId?.message}>
            <select className="input" aria-label="Categoria pai" {...form.register('parentId')}>
              <option value="">Nenhuma</option>
              {allFlatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </form>
    </Modal>
  )
}

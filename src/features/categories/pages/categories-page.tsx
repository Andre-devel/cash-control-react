import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useHideCategory } from '@/features/categories/hooks/use-hide-category'
import { useShowCategory } from '@/features/categories/hooks/use-show-category'
import { useUnarchiveCategory } from '@/features/categories/hooks/use-unarchive-category'
import { CategoryTree } from '@/features/categories/components/category-tree'
import { CreateCategoryDialog } from '@/features/categories/components/create-category-dialog'
import { EditCategoryDialog } from '@/features/categories/components/edit-category-dialog'
import { CategorizationRulesSection } from '@/features/categories/components/categorization-rules-section'
import { useArchiveCategory } from '@/features/categories/hooks/use-archive-category'
import type { Category } from '@/features/categories/types'

function CategoriesSkeleton() {
  return (
    <div className="card" aria-busy="true" aria-label="Carregando categorias">
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: 44, borderRadius: 8, background: 'var(--surface-3)' }}
          />
        ))}
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [showHidden, setShowHidden] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useCategories({ includeHidden: showHidden, includeArchived: showArchived })

  const { mutate: hideCategory } = useHideCategory()
  const { mutate: showCategory } = useShowCategory()
  const { mutate: archiveCategory } = useArchiveCategory()
  const { mutate: unarchiveCategory } = useUnarchiveCategory()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)

  const allCategories = useMemo(() => categories ?? [], [categories])
  const activeCategories = useMemo(() => allCategories.filter((c) => !c.archived), [allCategories])

  const handleEdit = useCallback((category: Category) => setEditTarget(category), [])
  const handleHide = useCallback((category: Category) => hideCategory(category.id), [hideCategory])
  const handleShow = useCallback((category: Category) => showCategory(category.id), [showCategory])
  const handleArchive = useCallback(
    (category: Category) => archiveCategory(category.id),
    [archiveCategory],
  )
  const handleUnarchive = useCallback(
    (category: Category) => unarchiveCategory(category.id),
    [unarchiveCategory],
  )

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Categorias</h1>
          <div className="desc">
            {isLoading
              ? 'Carregando…'
              : isError
                ? '—'
                : `${allCategories.length} ${allCategories.length === 1 ? 'categoria' : 'categorias'}`}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHidden((v) => !v)}
            aria-pressed={showHidden}
          >
            {showHidden ? 'Ocultar ocultas' : 'Mostrar ocultas'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
          >
            {showArchived ? 'Ocultar arquivadas' : 'Mostrar arquivadas'}
          </Button>
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Nova categoria
          </Button>
        </div>
      </div>

      {isLoading ? (
        <CategoriesSkeleton />
      ) : isError ? (
        <div className="card">
          <div
            className="card-b"
            role="alert"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <p style={{ color: 'var(--expense)', fontSize: 14 }}>Falha ao carregar categorias.</p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : allCategories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria encontrada"
          desc="Crie sua primeira categoria para organizar suas transações."
          action={
            <Button
              variant="primary"
              leading={<Plus size={14} />}
              onClick={() => setCreateOpen(true)}
            >
              Criar primeira categoria
            </Button>
          }
        />
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-b flush">
            <CategoryTree
              categories={allCategories}
              onEdit={handleEdit}
              onHide={handleHide}
              onShow={handleShow}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          </div>
        </div>
      )}

      <CategorizationRulesSection categories={activeCategories} />

      <CreateCategoryDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditCategoryDialog
        category={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}

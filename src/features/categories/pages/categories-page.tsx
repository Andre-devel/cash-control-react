import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-2" aria-busy="true" aria-label="Loading categories">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
      ))}
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

  const allCategories = categories ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setShowHidden((v) => !v)}
            aria-pressed={showHidden}
          >
            {showHidden ? 'Hide Hidden' : 'Show Hidden'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button
            size="sm"
            className="min-h-[44px]"
            onClick={() => setCreateOpen(true)}
            aria-label="New Category"
          >
            New Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <CategoriesSkeleton />
      ) : isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load categories.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : allCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No categories found.</p>
          <Button size="sm" className="min-h-[44px]" onClick={() => setCreateOpen(true)}>
            Create your first category
          </Button>
        </div>
      ) : (
        <CategoryTree
          categories={allCategories}
          onEdit={(category) => setEditTarget(category)}
          onHide={(category) => hideCategory(category.id)}
          onShow={(category) => showCategory(category.id)}
          onArchive={(category) => archiveCategory(category.id)}
          onUnarchive={(category) => unarchiveCategory(category.id)}
        />
      )}

      <CategorizationRulesSection categories={allCategories.filter((c) => !c.archived)} />

      <CreateCategoryDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditCategoryDialog
        category={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />
    </div>
  )
}

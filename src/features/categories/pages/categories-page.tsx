import { useCallback, useMemo, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, EyeOff, Info, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import type { Category } from '@/features/categories/types'

function CategoriesSkeleton() {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl border border-border bg-surface-1 p-2"
      aria-busy="true"
      aria-label="Carregando categorias"
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex min-h-[56px] items-center gap-3 px-2">
          <div className="h-9 w-9 animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
          <div className="h-3 w-32 animate-pulse rounded-xs bg-surface-3 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  )
}

type CategoriesTab = 'categorias' | 'regras'

const TABS: { id: CategoriesTab; label: string }[] = [
  { id: 'categorias', label: 'Categorias' },
  { id: 'regras', label: 'Regras automáticas' },
]

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
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
  const { mutate: archiveCategory, isPending: isArchiving } = useArchiveCategory()
  const { mutate: unarchiveCategory } = useUnarchiveCategory()
  const { data: accounts } = useAccounts()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null)

  const allCategories = useMemo(() => categories ?? [], [categories])
  const activeAccounts = useMemo(() => (accounts ?? []).filter((a) => !a.archivedAt), [accounts])

  const handleEdit = useCallback((category: Category) => setEditTarget(category), [])
  const handleHide = useCallback((category: Category) => hideCategory(category.id), [hideCategory])
  const handleShow = useCallback((category: Category) => showCategory(category.id), [showCategory])
  const handleArchive = useCallback((category: Category) => setArchiveTarget(category), [])

  function confirmArchive() {
    if (!archiveTarget) return
    archiveCategory(archiveTarget.id, { onSuccess: () => setArchiveTarget(null) })
  }
  const handleUnarchive = useCallback(
    (category: Category) => unarchiveCategory(category.id),
    [unarchiveCategory],
  )

  const tab: CategoriesTab = searchParams.get('aba') === 'regras' ? 'regras' : 'categorias'

  function selectTab(next: CategoriesTab) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'regras') params.set('aba', 'regras')
        else params.delete('aba')
        return params
      },
      { replace: true },
    )
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = tab === 'categorias' ? 'regras' : 'categorias'
    selectTab(next)
    document.getElementById(`categories-tab-${next}`)?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="page-h !mb-0">
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
        {tab === 'categorias' && (
          <div className="actions">
            <Button
              variant="primary"
              className="min-w-touch"
              leading={<Plus size={16} aria-hidden="true" />}
              onClick={() => setCreateOpen(true)}
              aria-label="Nova categoria"
            >
              <span className="hidden md:inline">Nova categoria</span>
            </Button>
          </div>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Seções de categorias"
        className="flex gap-1 border-b border-border"
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map((t) => {
          const selected = tab === t.id
          return (
            <button
              key={t.id}
              id={`categories-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`categories-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(t.id)}
              className={`-mb-px min-h-touch cursor-pointer border-0 border-b-2 bg-transparent px-3 text-body-sm font-semibold transition-colors ${
                selected ? 'border-brand text-fg' : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'categorias' ? (
        <div
          id="categories-panel-categorias"
          role="tabpanel"
          aria-labelledby="categories-tab-categorias"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
            <Button
              size="sm"
              variant={showHidden ? 'default' : 'ghost'}
              className="min-h-touch md:min-h-0"
              leading={<EyeOff size={14} aria-hidden="true" />}
              onClick={() => setShowHidden((v) => !v)}
              aria-pressed={showHidden}
            >
              Mostrar ocultas
            </Button>
            <Button
              size="sm"
              variant={showArchived ? 'default' : 'ghost'}
              className="min-h-touch md:min-h-0"
              leading={<Archive size={14} aria-hidden="true" />}
              onClick={() => setShowArchived((v) => !v)}
              aria-pressed={showArchived}
            >
              Mostrar arquivadas
            </Button>
          </div>

          <details className="group rounded-lg bg-surface-2 px-3 py-2 text-body-sm text-fg-muted">
            <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 font-medium text-fg md:min-h-0 [&::-webkit-details-marker]:hidden">
              <Info size={15} aria-hidden="true" />
              Ocultar ou arquivar?
            </summary>
            <p className="m-0 pb-1 pt-1">
              <strong>Ocultar</strong> tira a categoria (e as subcategorias) dos seletores, mas os
              lançamentos que já usam ela continuam nos relatórios; vale também para as categorias
              do sistema. <strong>Arquivar</strong> é para categorias suas que deixaram de existir:
              leva as subcategorias junto e libera o nome para uma nova.
            </p>
          </details>

          {isLoading ? (
            <CategoriesSkeleton />
          ) : isError ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface-1 p-4"
            >
              <p className="text-body-sm text-expense">Falha ao carregar categorias.</p>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
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
            <div className="rounded-2xl border border-border bg-surface-1 px-1.5 py-1 md:px-2">
              <CategoryTree
                categories={allCategories}
                onEdit={handleEdit}
                onHide={handleHide}
                onShow={handleShow}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            </div>
          )}
        </div>
      ) : (
        <div id="categories-panel-regras" role="tabpanel" aria-labelledby="categories-tab-regras">
          <CategorizationRulesSection categories={allCategories} accounts={activeAccounts} />
        </div>
      )}

      <CreateCategoryDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <EditCategoryDialog
        category={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
      />

      {archiveTarget && (
        <Modal
          title="Arquivar categoria"
          onClose={() => setArchiveTarget(null)}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={() => setArchiveTarget(null)}>
                Cancelar
              </Button>
              <div className="spacer" />
              <Button
                type="button"
                variant="primary"
                loading={isArchiving}
                onClick={confirmArchive}
              >
                {isArchiving ? 'Arquivando…' : 'Arquivar categoria'}
              </Button>
            </>
          }
        >
          <p>
            Arquivar <strong>{archiveTarget.name}</strong>
            {archiveTarget.subcategories && archiveTarget.subcategories.length > 0
              ? ' e as subcategorias dela'
              : ''}
            ? Ela deixa de aparecer nos seletores; os lançamentos existentes continuam com ela. Dá
            para desarquivar em &ldquo;Mostrar arquivadas&rdquo;.
          </p>
        </Modal>
      )}
    </div>
  )
}

import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import { suggestRulePattern } from '@/features/categories/utils/suggest-rule-pattern'
import type { Category } from '@/features/categories/types'
import type { CreateCategorizationRuleFormValues } from '@/features/categories/schemas/create-categorization-rule.schema'

/** Valores com que o diálogo de regra abre, já no formato do formulário. */
export type CategorizationRuleDraft = Required<CreateCategorizationRuleFormValues>

export interface CategorizationRuleOfferInput {
  /** Descrição como veio do banco ou do arquivo, não o apelido que o usuário deu. */
  description: string
  counterpartyName?: string | null
  /** Categoria que o usuário acabou de escolher: raiz ou subcategoria. */
  categoryId: string | null
  accountId?: string | null
  /** A categoria sugerida para a linha já veio de uma regra: outra regra só a duplicaria. */
  suggestedByRule?: boolean
}

/** Um aviso por vez: trocar a categoria de outra linha substitui a oferta anterior. */
const OFFER_TOAST_ID = 'categorization-rule-offer'

/**
 * Depois que o usuário corrige a categoria de uma linha importada, oferece num aviso criar
 * a regra que faria essa correção sozinha da próxima vez. A ação "Criar regra" preenche
 * `draft`, que a tela passa ao `CreateRuleDialog`.
 */
export function useCategorizationRuleOffer(categories: Category[]) {
  const [draft, setDraft] = useState<CategorizationRuleDraft | null>(null)

  const offer = useCallback(
    (input: CategorizationRuleOfferInput) => {
      if (input.suggestedByRule || !input.categoryId) return
      const category = flattenCategories(categories).find((c) => c.id === input.categoryId)
      if (!category) return
      const pattern = suggestRulePattern(input.description, input.counterpartyName)
      if (!pattern) return

      const next: CategorizationRuleDraft = {
        pattern,
        categoryId: category.parentId ?? category.id,
        subcategoryId: category.parentId ? category.id : '',
        accountId: input.accountId ?? '',
      }
      toast.action(
        `Tudo com «${pattern}» vai para ${category.name}?`,
        { label: 'Criar regra', onClick: () => setDraft(next) },
        { id: OFFER_TOAST_ID, duration: 10_000 },
      )
    },
    [categories],
  )

  const close = useCallback(() => setDraft(null), [])

  return { draft, offer, close }
}

import { create } from 'zustand'

/** Escopo de uma conta ou cartão: pessoa física (PF) ou jurídica (PJ). */
export type AccountScope = 'PERSONAL' | 'BUSINESS'

/** Filtro global PF / PJ / Tudo. `ALL` é o padrão e o que a API assume sem o parâmetro. */
export type ScopeFilter = AccountScope | 'ALL'

export const SCOPE_STORAGE_KEY = 'cash-control-react:scope'

const SCOPE_FILTERS: readonly ScopeFilter[] = ['PERSONAL', 'BUSINESS', 'ALL']

/**
 * Mesmo padrão de `@/lib/persisted-flag`, só que com três valores: guardado por aparelho no
 * `localStorage`; sem armazenamento (navegação privada, bloqueio), volta para "Tudo".
 */
export function readScope(): ScopeFilter {
  try {
    const stored = localStorage.getItem(SCOPE_STORAGE_KEY)
    return SCOPE_FILTERS.includes(stored as ScopeFilter) ? (stored as ScopeFilter) : 'ALL'
  } catch {
    return 'ALL'
  }
}

function storeScope(scope: ScopeFilter) {
  try {
    localStorage.setItem(SCOPE_STORAGE_KEY, scope)
  } catch {
    // Navegação privada ou armazenamento bloqueado: vale só para esta sessão.
  }
}

interface ScopeState {
  scope: ScopeFilter
  setScope: (scope: ScopeFilter) => void
}

export const useScopeStore = create<ScopeState>((set) => ({
  scope: readScope(),
  setScope: (scope) => {
    storeScope(scope)
    set({ scope })
  },
}))

/** Escopo atual do filtro global; os hooks de listagem e de dashboard o mandam para a API. */
export function useScope(): ScopeFilter {
  return useScopeStore((s) => s.scope)
}

/**
 * Parâmetro `scope` das funções de `api/`. "Tudo" vai como ausência do parâmetro: é o padrão
 * da API, e a chamada fica igual à de antes do filtro existir.
 */
export function scopeParams(scope: ScopeFilter = 'ALL'): { scope?: AccountScope } {
  return scope === 'ALL' ? {} : { scope }
}

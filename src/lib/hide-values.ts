import { create } from 'zustand'

/**
 * "Ocultar valores" (botão de olho da Dashboard). Global: `<Money>` e os widgets da
 * Dashboard trocam os valores por `R$ ••••` enquanto estiver ligado.
 */
export const HIDE_VALUES_STORAGE_KEY = 'cash-control-react:hide-values'

function readStored(): boolean {
  try {
    return localStorage.getItem(HIDE_VALUES_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function store(hidden: boolean) {
  try {
    localStorage.setItem(HIDE_VALUES_STORAGE_KEY, hidden ? '1' : '0')
  } catch {
    // Navegação privada ou armazenamento bloqueado: vale só para esta sessão.
  }
}

interface HideValuesState {
  hidden: boolean
  toggle: () => void
}

export const useHideValuesStore = create<HideValuesState>((set, get) => ({
  hidden: readStored(),
  toggle: () => {
    const next = !get().hidden
    store(next)
    set({ hidden: next })
  },
}))

export function useHideValues() {
  const hidden = useHideValuesStore((s) => s.hidden)
  const toggle = useHideValuesStore((s) => s.toggle)
  return { hidden, toggle }
}

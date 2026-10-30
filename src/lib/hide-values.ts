import { create } from 'zustand'
import { readFlag, storeFlag } from './persisted-flag'

/**
 * "Ocultar valores" (botão de olho da Dashboard). Global: `<Money>` e os widgets da
 * Dashboard trocam os valores por `R$ ••••` enquanto estiver ligado.
 */
export const HIDE_VALUES_STORAGE_KEY = 'cash-control-react:hide-values'

interface HideValuesState {
  hidden: boolean
  toggle: () => void
}

export const useHideValuesStore = create<HideValuesState>((set, get) => ({
  hidden: readFlag(HIDE_VALUES_STORAGE_KEY),
  toggle: () => {
    const next = !get().hidden
    storeFlag(HIDE_VALUES_STORAGE_KEY, next)
    set({ hidden: next })
  },
}))

export function useHideValues() {
  const hidden = useHideValuesStore((s) => s.hidden)
  const toggle = useHideValuesStore((s) => s.toggle)
  return { hidden, toggle }
}

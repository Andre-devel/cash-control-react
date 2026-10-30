import { create } from 'zustand'
import { readFlag, storeFlag } from './persisted-flag'

/**
 * "Descontar faturas em aberto" do patrimônio líquido da Dashboard. Vale por aparelho, como
 * "Ocultar valores": é um jeito de olhar o número, não um dado da conta.
 */
export const DISCOUNT_INVOICES_STORAGE_KEY = 'cash-control-react:discount-invoices'

interface DiscountInvoicesState {
  discount: boolean
  toggle: () => void
}

export const useDiscountInvoicesStore = create<DiscountInvoicesState>((set, get) => ({
  discount: readFlag(DISCOUNT_INVOICES_STORAGE_KEY),
  toggle: () => {
    const next = !get().discount
    storeFlag(DISCOUNT_INVOICES_STORAGE_KEY, next)
    set({ discount: next })
  },
}))

export function useDiscountInvoices() {
  const discount = useDiscountInvoicesStore((s) => s.discount)
  const toggle = useDiscountInvoicesStore((s) => s.toggle)
  return { discount, toggle }
}

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthStore, AuthUser } from '@/features/auth/types'
import type { Theme } from '@/styles/theme/dark-mode'
import { applyTheme, resolveTheme, storeTheme } from '@/styles/theme/dark-mode'

const AUTH_STORAGE_KEY = 'cash-control-react:auth'

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  theme: 'system' as Theme,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setToken: (token: string) => set({ token, isAuthenticated: true }),

      setUser: (user: AuthUser) => set({ user }),

      // A preferência de tema não faz parte da sessão: sobrevive a logout e a 401.
      clearSession: () => set((state) => ({ ...initialState, theme: state.theme })),

      setTheme: (theme: Theme) => {
        applyTheme(resolveTheme(theme))
        // Espelha na chave standalone lida pelo script inline do index.html,
        // que roda antes do React e evita o flash de tema errado.
        storeTheme(theme)
        set({ theme })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyTheme(resolveTheme(state.theme))
          storeTheme(state.theme)
        }
      },
    },
  ),
)

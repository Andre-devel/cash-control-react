import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthStore, AuthUser } from '@/features/auth/types'
import type { Theme } from '@/styles/theme/dark-mode'
import { applyTheme, resolveTheme } from '@/styles/theme/dark-mode'

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

      setToken: (token: string) =>
        set({ token, isAuthenticated: true }),

      setUser: (user: AuthUser) =>
        set({ user }),

      clearSession: () =>
        set({ ...initialState }),

      setTheme: (theme: Theme) => {
        applyTheme(resolveTheme(theme))
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
        }
      },
    },
  ),
)

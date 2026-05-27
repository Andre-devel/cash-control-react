export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  ROLES: '/admin/roles',
  ROLE_DETAIL: '/admin/roles/:roleId',
  FORBIDDEN: '/forbidden',
  ACCOUNTS: '/accounts',
  ACCOUNT_DETAIL: '/accounts/:id',
  TRANSACTIONS: '/transactions',
  TRANSACTION_DETAIL: '/transactions/:id',
  INSTALLMENTS: '/installments',
  RECURRENCES: '/recurrences',
  CATEGORIES: '/categories',
  CARDS: '/cards',
  CARD_DETAIL: '/cards/:id',
  PROFILE: '/profile',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

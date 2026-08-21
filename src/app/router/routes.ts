export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  ROLES: '/admin/roles',
  ROLE_DETAIL: '/admin/roles/:roleId',
  AUDIT: '/admin/audit',
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
  INVOICES: '/invoices',
  INVOICE_DETAIL: '/invoices/:invoiceId',
  PROFILE: '/profile',
  /** Destino do Web Share Target (manifest `share_target.action`) e do link manual. */
  SHARE_TARGET: '/share-target',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

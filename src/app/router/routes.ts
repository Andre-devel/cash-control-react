export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  /** Destinos do redirect da API ao fim do OAuth2 (OAUTH2_SUCCESS/FAILURE_REDIRECT_URL). */
  OAUTH2_CALLBACK: '/auth/oauth2/callback',
  OAUTH2_ERROR: '/auth/oauth2/error',
  /** Pública, sem login: é a URL cadastrada no consentimento OAuth do Google. */
  PRIVACY_POLICY: '/privacidade',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  ROLES: '/admin/roles',
  ROLE_DETAIL: '/admin/roles/:roleId',
  AUDIT: '/admin/audit',
  FORBIDDEN: '/forbidden',
  ACCOUNTS: '/accounts',
  ACCOUNT_DETAIL: '/accounts/:id',
  INVESTMENTS: '/investments',
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
  /** Fila de lançamentos avisados pelo banco; a notificação do celular abre aqui. */
  BANK_REVIEW: '/revisar',
  /** Destino do Web Share Target (manifest `share_target.action`) e do link manual. */
  SHARE_TARGET: '/share-target',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

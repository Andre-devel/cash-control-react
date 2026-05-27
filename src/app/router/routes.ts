export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  ROLES: '/admin/roles',
  ROLE_DETAIL: '/admin/roles/:roleId',
  FORBIDDEN: '/forbidden',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

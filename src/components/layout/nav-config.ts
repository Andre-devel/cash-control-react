import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import {
  LayoutGrid,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  CreditCard,
  ReceiptText,
  Tags,
  Layers,
  Repeat,
  UserRound,
  ScrollText,
  ShieldCheck,
  Inbox,
  Target,
} from 'lucide-react'
import { ROUTES } from '@/app/router/routes'

export type NavIcon = ComponentType<LucideProps>

export interface NavItem {
  id: string
  label: string
  /** Rótulo curto da barra inferior do celular, quando difere do da sidebar. */
  shortLabel?: string
  icon: NavIcon
  path: string
  end?: boolean
  /** Basta uma das permissões (mesma regra do PermissionGuard da rota). */
  anyPermission?: string[]
  /** Contagem ao lado do rótulo; só o selo da fila do banco existe hoje. */
  badge?: 'bank-pending'
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Fonte única da navegação: a sidebar (≥ 1280), o rail (768–1279) e a folha "Mais" do
 * celular leem daqui. Itens sem permissão são removidos, não desabilitados.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Geral',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        shortLabel: 'Início',
        icon: LayoutGrid,
        path: ROUTES.DASHBOARD,
        end: true,
      },
      { id: 'transactions', label: 'Transações', icon: ArrowLeftRight, path: ROUTES.TRANSACTIONS },
      { id: 'accounts', label: 'Contas', icon: Landmark, path: ROUTES.ACCOUNTS },
      { id: 'investments', label: 'Investimentos', icon: PiggyBank, path: ROUTES.INVESTMENTS },
      { id: 'cards', label: 'Cartões', icon: CreditCard, path: ROUTES.CARDS },
      { id: 'invoices', label: 'Faturas', icon: ReceiptText, path: ROUTES.INVOICES },
      {
        id: 'bank-review',
        label: 'Revisar',
        icon: Inbox,
        path: ROUTES.BANK_REVIEW,
        badge: 'bank-pending',
      },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { id: 'budgets', label: 'Orçamentos', icon: Target, path: ROUTES.BUDGETS },
      { id: 'categories', label: 'Categorias', icon: Tags, path: ROUTES.CATEGORIES },
      { id: 'installments', label: 'Parcelamentos', icon: Layers, path: ROUTES.INSTALLMENTS },
      { id: 'recurrences', label: 'Recorrências', icon: Repeat, path: ROUTES.RECURRENCES },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'profile', label: 'Perfil', icon: UserRound, path: ROUTES.PROFILE },
      {
        id: 'roles',
        label: 'Funções',
        icon: ShieldCheck,
        path: ROUTES.ROLES,
        anyPermission: ['role:create', 'role:update', 'role:delete'],
      },
      {
        id: 'audit',
        label: 'Auditoria',
        icon: ScrollText,
        path: ROUTES.AUDIT,
        anyPermission: ['audit:view'],
      },
    ],
  },
]

/** Itens fixos da barra inferior do celular; o FAB fica no meio e "Mais" no fim. */
export const BOTTOM_NAV_IDS = ['dashboard', 'transactions', 'cards'] as const

export function visibleSections(permissions: string[]): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.anyPermission || item.anyPermission.some((p) => permissions.includes(p)),
    ),
  })).filter((section) => section.items.length > 0)
}

export function findNavItem(id: string): NavItem {
  const item = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === id)
  if (!item) throw new Error(`Item de navegação desconhecido: ${id}`)
  return item
}

/** Rótulo da página atual, para o título do header (celular) e da topbar (desktop). */
export function currentNavLabel(pathname: string): string | undefined {
  const items = NAV_SECTIONS.flatMap((s) => s.items)
  return items.find((item) =>
    item.end
      ? pathname === item.path
      : pathname === item.path || pathname.startsWith(item.path + '/'),
  )?.label
}

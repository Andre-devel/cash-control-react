import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  List,
  Wallet,
  CreditCard,
  Tag,
  Layers,
  Repeat,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ROUTES } from '@/app/router/routes'
import { resolveTheme } from '@/styles/theme/dark-mode'

type LucideIcon = React.ComponentType<LucideProps>

type NavSection = { sec: string }
type NavLink_ = {
  id: string
  label: string
  icon: LucideIcon
  badge?: string
  path: string
  end?: boolean
  requirePermission?: string
}
type NavItem = NavSection | NavLink_

function isNavLink(item: NavItem): item is NavLink_ {
  return 'id' in item
}

const NAV_ITEMS: NavItem[] = [
  { sec: 'Geral' },
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: ROUTES.DASHBOARD, end: true },
  { id: 'transactions', label: 'Transações', icon: List, path: ROUTES.TRANSACTIONS },
  { id: 'accounts', label: 'Contas', icon: Wallet, path: ROUTES.ACCOUNTS },
  { id: 'cards', label: 'Cartões', icon: CreditCard, path: ROUTES.CARDS },
  { sec: 'Gestão' },
  { id: 'categories', label: 'Categorias', icon: Tag, path: ROUTES.CATEGORIES },
  { id: 'installments', label: 'Parcelamentos', icon: Layers, path: ROUTES.INSTALLMENTS },
  { id: 'recurrences', label: 'Recorrências', icon: Repeat, path: ROUTES.RECURRENCES },
  { sec: 'Sistema' },
  { id: 'settings', label: 'Configurações', icon: Settings, path: ROUTES.PROFILE },
  {
    id: 'audit',
    label: 'Auditoria',
    icon: ShieldCheck,
    path: ROUTES.AUDIT,
    requirePermission: 'audit:view',
  },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const theme = useAuthStore((s) => s.theme)
  const setTheme = useAuthStore((s) => s.setTheme)

  const resolvedTheme = resolveTheme(theme)

  const userPermissions = user?.permissions ?? []

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!isNavLink(item)) return true
    if (!item.requirePermission) return true
    return userPermissions.includes(item.requirePermission)
  })

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CC'

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      {open && <div className="sidebar-overlay" aria-hidden="true" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <span className="logo">C</span>
          <div className="name">
            Cash Control
            <small>cashcontrol.app</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {visibleItems.map((item, i) =>
            !isNavLink(item) ? (
              <div className="nav-section" key={`sec-${i}`}>
                {item.sec}
              </div>
            ) : (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                aria-current={undefined}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={16} className="ico" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && <span className="badge">{item.badge}</span>}
                    <span className="sr-only">{isActive ? '(página atual)' : ''}</span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>

        <div className="sidebar-foot">
          <Avatar name={initials} color="var(--accent)" />
          <div className="who">
            <div className="n">{user?.name ?? 'Usuário'}</div>
            <div className="e">{user?.email ?? ''}</div>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title="Alternar tema"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'
            }
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={14} aria-hidden="true" />
            ) : (
              <Moon size={14} aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

import { NavLink } from 'react-router-dom'
import { Wallet, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { VersionInfo } from '@/features/version'
import { resolveTheme } from '@/styles/theme/dark-mode'
import { visibleSections } from './nav-config'
import { userInitials } from './user-initials'

/**
 * Navegação lateral do tablet e do desktop. A mesma marcação vira rail de 76 px entre
 * 768 e 1279 px (só ícones, rótulo no `title`/`aria-label`) e sidebar de 264 px a partir
 * de 1280 px — a troca é só CSS. Abaixo de 768 px quem navega é a barra inferior.
 */
export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const theme = useAuthStore((s) => s.theme)
  const setTheme = useAuthStore((s) => s.setTheme)
  const resolvedTheme = resolveTheme(theme)
  const sections = visibleSections(user?.permissions ?? [])

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="logo" aria-hidden="true">
          <Wallet size={18} />
        </span>
        <div className="name">Cash Control</div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {sections.map((section) => (
          <div key={section.title} className="nav-group">
            <div className="nav-section">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.end}
                title={item.label}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon size={20} className="ico" aria-hidden="true" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="avatar avatar-brand" aria-hidden="true">
          {userInitials(user?.name)}
        </span>
        <div className="who">
          <div className="n">{user?.name ?? 'Usuário'}</div>
          <div className="e">{user?.email ?? ''}</div>
          <VersionInfo />
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm theme-toggle"
          title="Alternar tema"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  )
}

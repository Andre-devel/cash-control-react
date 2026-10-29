import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Download, Ellipsis, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { useInstallPrompt } from '@/app/pwa/use-install-prompt'
import type { Theme } from '@/styles/theme/dark-mode'
import { BOTTOM_NAV_IDS, findNavItem, visibleSections } from './nav-config'
import { QuickActionsFab } from './quick-actions'

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

function MoreSheet({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const theme = useAuthStore((s) => s.theme)
  const setTheme = useAuthStore((s) => s.setTheme)
  const logout = useLogout()
  const { canInstall, promptInstall } = useInstallPrompt()
  const bottomIds: readonly string[] = BOTTOM_NAV_IDS
  const sections = visibleSections(user?.permissions ?? [])
    .map((s) => ({ ...s, items: s.items.filter((i) => !bottomIds.includes(i.id)) }))
    .filter((s) => s.items.length > 0)

  return (
    <Modal title="Mais" onClose={onClose}>
      <nav aria-label="Mais seções" className="more-sheet">
        {sections.map((section) => (
          <div key={section.title} className="more-group">
            <div className="nav-section">{section.title}</div>
            <div className="more-grid">
              {section.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `more-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={22} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="more-group">
          <div className="nav-section" id="more-theme-label">
            Tema
          </div>
          <div className="segmented" role="radiogroup" aria-labelledby="more-theme-label">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={theme === opt.value}
                className={theme === opt.value ? 'on' : undefined}
                onClick={() => setTheme(opt.value)}
              >
                <opt.icon size={16} aria-hidden="true" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="more-actions">
          {canInstall && (
            <button type="button" className="btn" onClick={() => void promptInstall()}>
              <Download size={16} aria-hidden="true" />
              Instalar app
            </button>
          )}
          <button type="button" className="btn btn-danger" onClick={logout}>
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        </div>
      </nav>
    </Modal>
  )
}

/**
 * Barra inferior do celular (< 768 px): três destinos fixos, FAB central de ações rápidas
 * e "Mais" com o restante da navegação, tema, instalar e sair.
 */
export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const [first, second, third] = BOTTOM_NAV_IDS.map(findNavItem)
  // "Mais" acende quando a página atual não tem atalho próprio na barra.
  const moreActive = ![first, second, third].some((i) =>
    i.end ? pathname === i.path : pathname === i.path || pathname.startsWith(i.path + '/'),
  )

  const link = (item: typeof first) => (
    <NavLink
      key={item.id}
      to={item.path}
      end={item.end}
      className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
    >
      <item.icon size={22} aria-hidden="true" />
      <span>{item.shortLabel ?? item.label}</span>
    </NavLink>
  )

  return (
    <>
      <nav className="bottom-nav" aria-label="Navegação principal">
        {link(first)}
        {link(second)}
        <div className="bottom-nav-fab">
          <QuickActionsFab />
        </div>
        {link(third)}
        <button
          type="button"
          className={`bottom-nav-item${moreActive ? ' active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <Ellipsis size={22} aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  )
}

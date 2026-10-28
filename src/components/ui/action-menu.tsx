import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import { Button } from './button'

export interface ActionMenuItem {
  label: string
  onSelect: () => void
  danger?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  /** Nome acessível do botão "…". */
  label?: string
}

/**
 * Botão "…" que abre uma lista de ações. A lista é `position: fixed` num portal para não ser
 * cortada por tabelas com rolagem própria; fecha com Esc, clique fora, rolagem ou resize.
 */
export function ActionMenu({ items, label = 'Mais ações' }: ActionMenuProps) {
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = anchor !== null

  useEffect(() => {
    if (!open) return
    const close = () => setAnchor(null)
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      close()
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  if (items.length === 0) return null

  function toggle() {
    if (open || !triggerRef.current) {
      setAnchor(null)
      return
    }
    const rect = triggerRef.current.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="ghost"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <MoreHorizontal size={14} />
      </Button>
      {anchor &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            className="action-menu"
            style={{ top: anchor.top, right: anchor.right }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={item.danger ? 'action-menu-item danger' : 'action-menu-item'}
                onClick={() => {
                  setAnchor(null)
                  item.onSelect()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

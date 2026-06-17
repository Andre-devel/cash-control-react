import React from 'react'
import { ChevronRight, Menu } from 'lucide-react'

interface TopbarProps {
  breadcrumb?: string[]
  title?: string
  children?: React.ReactNode
  onMenuClick?: () => void
}

export function Topbar({ breadcrumb, title, children, onMenuClick }: TopbarProps) {
  return (
    <header className="topbar">
      <button
        className="topbar-menu-btn btn btn-ghost btn-icon btn-sm"
        aria-label="Abrir menu"
        onClick={onMenuClick}
      >
        <Menu size={18} aria-hidden="true" />
      </button>
      {breadcrumb && breadcrumb.length > 0 ? (
        <div className="breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <ChevronRight size={12} strokeWidth={2} aria-hidden="true" />}
              {i === breadcrumb.length - 1 ? <b>{b}</b> : <span>{b}</span>}
            </span>
          ))}
        </div>
      ) : title ? (
        <h1>{title}</h1>
      ) : null}
      <div className="spacer" />
      {children}
    </header>
  )
}

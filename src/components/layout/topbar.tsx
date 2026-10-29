import React from 'react'
import { ChevronRight, Wallet } from 'lucide-react'

interface TopbarProps {
  breadcrumb?: string[]
  title?: string
  children?: React.ReactNode
}

/**
 * Topbar do tablet/desktop (breadcrumb + ações) e header compacto do celular, que mostra a
 * marca e o título da página atual. Ações globais ficam só no desktop; no celular elas
 * estão na folha "Mais".
 */
export function Topbar({ breadcrumb, title, children }: TopbarProps) {
  return (
    <header className="topbar">
      <span className="topbar-logo" aria-hidden="true">
        <Wallet size={16} />
      </span>
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
      {children && <div className="topbar-actions">{children}</div>}
    </header>
  )
}

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { ScopeSelector } from './scope-selector'

interface TopbarProps {
  breadcrumb?: string[]
  title?: string
  children?: React.ReactNode
  /** Mostra o seletor PF / PJ / Tudo (ele mesmo some para quem não tem conta ou cartão PJ). */
  scopeFilter?: boolean
}

/**
 * Topbar do tablet/desktop (breadcrumb + ações). No celular some: cada página abre com o
 * próprio título e as ações globais ficam na folha "Mais".
 */
export function Topbar({ breadcrumb, title, children, scopeFilter = false }: TopbarProps) {
  return (
    <header className="topbar">
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
      {scopeFilter && <ScopeSelector />}
      {children && <div className="topbar-actions">{children}</div>}
    </header>
  )
}

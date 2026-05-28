import React from 'react'
import { ChevronRight } from 'lucide-react'

interface TopbarProps {
  breadcrumb?: string[]
  title?: string
  children?: React.ReactNode
}

export function Topbar({ breadcrumb, title, children }: TopbarProps) {
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
      {children}
    </header>
  )
}

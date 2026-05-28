import type { ReactNode, ComponentType } from 'react'

interface EmptyStateProps {
  icon?: ComponentType<{ size?: number; stroke?: number }>
  title: string
  desc?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="icon">
        {Icon ? (
          <Icon size={22} stroke={1.4} />
        ) : (
          <svg
            className="ico"
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <circle cx="4" cy="6" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="4" cy="18" r="1" />
          </svg>
        )}
      </div>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  )
}

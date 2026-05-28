import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import type { Role } from '@/features/roles/types'

interface RoleCardProps {
  role: Role
}

export function RoleCard({ role }: RoleCardProps) {
  const href = ROUTES.ROLE_DETAIL.replace(':roleId', role.id)

  return (
    <Link
      to={href}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View role ${role.name}`}
    >
      <div className="card" style={{ transition: 'background 80ms' }}>
        <div className="card-b flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="fw-500 truncate">{role.name}</span>
              {role.systemRole && (
                <span className="badge muted shrink-0" style={{ borderRadius: 'var(--r-full)' }}>
                  System
                </span>
              )}
            </div>
            {role.description && (
              <p className="mt-1 text-xs text-dim truncate">{role.description}</p>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 shrink-0 text-dim"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

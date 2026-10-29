import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { ROUTES } from '@/app/router/routes'
import { RoleIcon, SystemRoleBadge } from './role-icon'
import type { Role } from '@/features/roles/types'

interface RoleCardProps {
  role: Role
}

function permissionLabel(count: number) {
  return count === 1 ? '1 permissão' : `${count} permissões`
}

/** Linha da lista de papéis (card no celular, linha densa no desktop). */
export function RoleCard({ role }: RoleCardProps) {
  const href = ROUTES.ROLE_DETAIL.replace(':roleId', role.id)

  return (
    <Link
      to={href}
      className="group flex min-h-[64px] items-center gap-3 px-4 py-3 text-fg no-underline transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      aria-label={`Ver papel ${role.name}`}
    >
      <RoleIcon role={role} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-body font-semibold">{role.name}</span>
          {role.systemRole && <SystemRoleBadge />}
        </div>
        {role.description && (
          <p className="m-0 mt-0.5 truncate text-body-sm text-fg-muted">{role.description}</p>
        )}
      </div>
      <span className="hidden flex-none text-body-sm tabular-nums text-fg-muted md:inline">
        {permissionLabel(role.permissionCount)}
      </span>
      <ChevronRight size={18} className="flex-none text-fg-subtle" aria-hidden="true" />
    </Link>
  )
}

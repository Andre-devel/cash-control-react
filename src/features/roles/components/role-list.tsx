import { RoleCard } from './role-card'
import type { Role } from '@/features/roles/types'

interface RoleListProps {
  roles: Role[]
  isLoading: boolean
  isEmpty: boolean
}

export function RoleList({ roles, isLoading, isEmpty }: RoleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading roles">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (isEmpty) {
    return null
  }

  return (
    <ul className="space-y-2" aria-label="Roles list">
      {roles.map((role) => (
        <li key={role.id}>
          <RoleCard role={role} />
        </li>
      ))}
    </ul>
  )
}

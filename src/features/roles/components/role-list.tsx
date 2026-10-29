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
      <div
        className="overflow-hidden rounded-xl border border-border bg-surface-1"
        aria-busy="true"
        aria-label="Carregando papéis"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <span className="h-10 w-10 flex-none animate-pulse rounded-md bg-surface-3 motion-reduce:animate-none" />
            <div className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 w-32 animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
              <span className="h-3 w-48 max-w-full animate-pulse rounded-sm bg-surface-3 motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isEmpty) {
    return null
  }

  return (
    <ul
      className="m-0 list-none overflow-hidden rounded-xl border border-border bg-surface-1 p-0"
      aria-label="Lista de papéis"
    >
      {roles.map((role) => (
        <li key={role.id} className="border-b border-border last:border-b-0">
          <RoleCard role={role} />
        </li>
      ))}
    </ul>
  )
}

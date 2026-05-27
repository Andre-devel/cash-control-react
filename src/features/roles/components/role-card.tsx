import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
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
      <Card className="transition-colors hover:bg-accent">
        <CardContent className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">{role.name}</span>
              {role.systemRole && (
                <span className="shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  System
                </span>
              )}
            </div>
            {role.description && (
              <p className="mt-0.5 text-sm text-muted-foreground truncate">{role.description}</p>
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
            className="ml-2 shrink-0 text-muted-foreground"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </CardContent>
      </Card>
    </Link>
  )
}

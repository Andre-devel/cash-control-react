import { Shield, UserRound } from 'lucide-react'
import type { Role } from '@/features/roles/types'

/** Bolha de ícone do papel: escudo para papéis do sistema, pessoa para os personalizados. */
export function RoleIcon({
  role,
  size = 'md',
}: {
  role: Pick<Role, 'systemRole'>
  size?: 'md' | 'lg'
}) {
  const Icon = role.systemRole ? Shield : UserRound
  const box = size === 'lg' ? 'h-12 w-12 rounded-lg' : 'h-10 w-10 rounded-md'
  const tone = role.systemRole ? 'bg-brand-soft text-brand-text' : 'bg-info/15 text-info'
  return (
    <span className={`grid flex-none place-items-center ${box} ${tone}`} aria-hidden="true">
      <Icon size={size === 'lg' ? 22 : 18} />
    </span>
  )
}

export function SystemRoleBadge(props: { 'aria-label'?: string }) {
  return (
    <span
      className="inline-flex h-[22px] flex-none items-center gap-1 rounded-full border border-border-strong px-2 text-overline uppercase text-fg-muted"
      {...props}
    >
      Sistema
    </span>
  )
}

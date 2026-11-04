import { forwardRef } from 'react'
import { Select, type SelectProps } from '@/components/ui/select'
import type { AccountScope } from '@/app/store/scope.store'

export { Select as NativeSelect } from '@/components/ui/select'

export const ACCOUNT_SCOPES = ['PERSONAL', 'BUSINESS'] as const satisfies readonly AccountScope[]

export const ACCOUNT_SCOPE_LABELS: Record<AccountScope, string> = {
  PERSONAL: 'Pessoal',
  BUSINESS: 'Empresa',
}

/** Select "Escopo" (Pessoal / Empresa) dos formulários de conta e de cartão. */
export const ScopeSelect = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => (
  <Select aria-label="Escopo" ref={ref} {...props}>
    {ACCOUNT_SCOPES.map((scope) => (
      <option key={scope} value={scope}>
        {ACCOUNT_SCOPE_LABELS[scope]}
      </option>
    ))}
  </Select>
))
ScopeSelect.displayName = 'ScopeSelect'

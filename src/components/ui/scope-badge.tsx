import { Badge } from '@/components/ui/badge'
import { useScope, type AccountScope } from '@/app/store/scope.store'

/**
 * Selo "PJ" de conta, cartão ou lançamento da pessoa jurídica. Só aparece com o filtro em
 * "Tudo": com "PF" ou "PJ" a tela inteira já é de um escopo só.
 */
export function ScopeBadge({ scope }: { scope?: AccountScope | null }) {
  const filter = useScope()
  if (scope !== 'BUSINESS' || filter !== 'ALL') return null
  return (
    <span title="Pessoa jurídica">
      <Badge kind="info" dot={false}>
        PJ
      </Badge>
    </span>
  )
}

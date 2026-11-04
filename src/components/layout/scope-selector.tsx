import { useEffect } from 'react'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useScopeStore, type ScopeFilter } from '@/app/store/scope.store'

const OPTIONS: { id: ScopeFilter; label: string; title: string }[] = [
  { id: 'PERSONAL', label: 'PF', title: 'Só pessoa física' },
  { id: 'BUSINESS', label: 'PJ', title: 'Só pessoa jurídica' },
  { id: 'ALL', label: 'Tudo', title: 'Pessoa física e jurídica' },
]

/**
 * `true` quando há ao menos uma conta ou cartão PJ. As listas vêm sem filtro de escopo de
 * propósito: com o filtro em "PF", a lista filtrada nunca traria as contas PJ.
 */
export function useHasBusinessScope(): boolean | undefined {
  const { data: accounts } = useAccounts()
  const { data: cards } = useCards()
  const found =
    accounts?.some((a) => a.scope === 'BUSINESS') || cards?.some((c) => c.scope === 'BUSINESS')
  if (found) return true
  // Ainda carregando: não dá para afirmar que não há PJ.
  return accounts === undefined || cards === undefined ? undefined : false
}

interface ScopeSelectorProps {
  className?: string
}

/**
 * Seletor PF / PJ / Tudo do filtro global. Só aparece para quem tem conta ou cartão PJ; se a
 * última conta PJ sumir com o filtro ligado, volta para "Tudo" em vez de deixar as telas vazias
 * sem nenhum controle à vista.
 */
export function ScopeSelector({ className = '' }: ScopeSelectorProps) {
  const hasBusiness = useHasBusinessScope()
  const scope = useScopeStore((s) => s.scope)
  const setScope = useScopeStore((s) => s.setScope)

  useEffect(() => {
    if (hasBusiness === false && scope !== 'ALL') setScope('ALL')
  }, [hasBusiness, scope, setScope])

  if (!hasBusiness) return null

  return (
    <div
      className={`flex rounded-lg bg-surface-2 p-[3px] ${className}`}
      role="radiogroup"
      aria-label="Escopo: pessoa física ou jurídica"
    >
      {OPTIONS.map((option) => {
        const on = scope === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={option.title}
            onClick={() => setScope(option.id)}
            className={`min-h-[36px] flex-1 rounded-md px-3 text-caption font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
              on ? 'bg-surface-3 text-fg' : 'text-fg-muted'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

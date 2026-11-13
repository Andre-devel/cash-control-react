import type { Account } from '@/features/accounts/types'

interface TransactionAccountFilterProps {
  accounts: Account[]
  /** Contas marcadas; vazio é "todas". */
  selected: string[]
  onChange: (ids: string[]) => void
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-[36px] shrink-0 rounded-full border px-3 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${
        on
          ? 'border-brand bg-brand/15 text-brand-text'
          : 'border-border-strong bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Contas da lista, um chip por conta: tocar liga ou desliga a conta, "Todas" limpa o recorte.
 * Desligar a última conta marcada volta para "Todas" — a lista nunca fica sem conta.
 */
export function TransactionAccountFilter({
  accounts,
  selected,
  onChange,
}: TransactionAccountFilterProps) {
  const active = accounts
    .filter((a) => a.archivedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (active.length < 2) return null

  const all = selected.length === 0
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  return (
    <div
      role="group"
      aria-label="Contas"
      className="scroll-x -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5"
    >
      <Chip on={all} onClick={() => onChange([])}>
        Todas
      </Chip>
      {active.map((account) => (
        <Chip
          key={account.id}
          on={selected.includes(account.id)}
          onClick={() => toggle(account.id)}
        >
          {account.name}
        </Chip>
      ))}
    </div>
  )
}

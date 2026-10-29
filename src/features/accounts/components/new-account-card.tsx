import { Plus } from 'lucide-react'

interface NewAccountCardProps {
  onClick: () => void
}

/** Card tracejado ao fim da grade. */
export function NewAccountCard({ onClick }: NewAccountCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border-strong bg-transparent p-4 text-center text-brand-text transition-colors hover:bg-brand/5 focus-visible:bg-brand/5"
    >
      <Plus size={20} aria-hidden="true" />
      <span className="text-body font-semibold">Adicionar conta</span>
      <span className="hidden max-w-[180px] text-caption text-fg-muted md:block">
        Corrente, poupança, carteira ou investimento
      </span>
    </button>
  )
}

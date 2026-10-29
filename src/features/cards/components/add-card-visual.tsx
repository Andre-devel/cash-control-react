import { Plus } from 'lucide-react'

interface AddCardVisualProps {
  onClick: () => void
}

export function AddCardVisual({ onClick }: AddCardVisualProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar cartão"
      className="flex min-h-[72px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border-strong bg-transparent text-body font-semibold text-brand-text transition-colors hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:h-full md:min-h-[200px] md:flex-col"
    >
      <Plus size={18} aria-hidden="true" />
      Adicionar cartão
    </button>
  )
}

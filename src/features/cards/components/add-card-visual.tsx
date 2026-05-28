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
      style={{
        flexShrink: 0,
        width: 280,
        height: 170,
        borderRadius: 14,
        border: '1.5px dashed var(--border-strong)',
        background: 'transparent',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <div className="col" style={{ alignItems: 'center', gap: 6 }}>
        <div className="icon-bubble lg" style={{ background: 'var(--surface-2)' }}>
          <Plus size={18} aria-hidden="true" />
        </div>
        <div className="text-sm fw-500">Adicionar cartão</div>
      </div>
    </button>
  )
}

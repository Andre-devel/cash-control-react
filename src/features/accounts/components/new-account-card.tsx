import { Plus } from 'lucide-react'

interface NewAccountCardProps {
  onClick: () => void
}

export function NewAccountCard({ onClick }: NewAccountCardProps) {
  return (
    <button
      type="button"
      className="card"
      onClick={onClick}
      aria-label="Adicionar conta"
      style={{
        borderStyle: 'dashed',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 184,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div className="col" style={{ alignItems: 'center', gap: 6 }}>
        <div
          className="icon-bubble lg"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          <Plus size={18} />
        </div>
        <div className="text-sm fw-500">Adicionar conta</div>
        <div className="text-xs text-dim" style={{ maxWidth: 180, textAlign: 'center' }}>
          Corrente, poupança, carteira ou investimento
        </div>
      </div>
    </button>
  )
}

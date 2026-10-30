import { lazy, Suspense } from 'react'

// O widget (zoid + iframe da Pluggy) só carrega quando o usuário pede para conectar.
const PluggyConnect = lazy(() =>
  import('react-pluggy-connect').then((module) => ({ default: module.PluggyConnect })),
)

interface PluggyConnectWidgetProps {
  connectToken: string
  /** Item a atualizar (renovar consentimento) em vez de criar outro. */
  updateItem?: string
  onSuccess: (itemId: string) => void
  onError: (message: string) => void
  onClose: () => void
}

export function PluggyConnectWidget({
  connectToken,
  updateItem,
  onSuccess,
  onError,
  onClose,
}: PluggyConnectWidgetProps) {
  return (
    <Suspense fallback={null}>
      <PluggyConnect
        connectToken={connectToken}
        updateItem={updateItem}
        // Bancos de teste da Pluggy só no dev, para exercitar o fluxo sem banco real.
        includeSandbox={import.meta.env.DEV}
        language="pt"
        onSuccess={({ item }: { item: { id: string } }) => onSuccess(item.id)}
        onError={({ message }: { message: string }) => onError(message)}
        onClose={onClose}
        onLoadError={() => onError('Não foi possível abrir a conexão com o banco.')}
      />
    </Suspense>
  )
}

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useDeleteHolding } from '@/features/investments/hooks/use-holding-mutations'
import type { FixedIncomeHolding } from '@/features/investments/types'

interface DeleteHoldingDialogProps {
  holding: FixedIncomeHolding | null
  onClose: () => void
}

export function DeleteHoldingDialog({ holding, onClose }: DeleteHoldingDialogProps) {
  const { mutate: remove, isPending } = useDeleteHolding()
  if (!holding) return null

  return (
    <Modal
      title="Excluir aplicação"
      subtitle={holding.name}
      onClose={onClose}
      alert
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            loading={isPending}
            onClick={() => remove(holding.id, { onSuccess: () => onClose() })}
          >
            Excluir
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-fg">
        Só o cadastro é excluído. A transferência que levou o dinheiro para a conta de investimento
        continua lá, e o valor volta a aparecer como não alocado.
      </p>
    </Modal>
  )
}

import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { formatInstantDate, formatLocalDate } from '@/lib/format-date'
import { useTransaction } from '@/features/transactions/hooks/use-transaction'
import { AttachmentSection } from '@/features/transactions/components/attachment-section'
import { EditTransactionDialog } from '@/features/transactions/components/edit-transaction-dialog'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { CancelTransactionDialog } from '@/features/transactions/components/cancel-transaction-dialog'
import { PayTransactionButton } from '@/features/transactions/components/pay-transaction-button'
import { useReactivateTransaction } from '@/features/transactions/hooks/use-reactivate-transaction'
import { TRANSACTION_TYPE_DISPLAY } from '@/features/transactions/utils/transaction-type'
import {
  TRANSACTION_STATUS_LABELS,
  canReactivateTransaction,
  isLockedTransaction,
} from '@/features/transactions/utils/transaction-status'
import { ROUTES } from '@/app/router/routes'

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando transação">
      <div className="h-8 w-48 rounded animate-pulse" style={{ background: 'var(--surface-3)' }} />
      <div className="h-32 rounded animate-pulse" style={{ background: 'var(--surface-3)' }} />
    </div>
  )
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: transaction, isLoading, isError } = useTransaction(id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const { mutate: reactivate, isPending: reactivating } = useReactivateTransaction()

  if (isLoading) return <DetailSkeleton />

  if (isError || !transaction) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Transação</h1>
        <div role="alert">
          <p className="text-sm" style={{ color: 'var(--expense)' }}>
            Falha ao carregar transação.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate(ROUTES.TRANSACTIONS)}
            className="mt-2"
          >
            Voltar para transações
          </Button>
        </div>
      </div>
    )
  }

  const isInvoicePayment = transaction.type === 'INVOICE_PAYMENT'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate(ROUTES.TRANSACTIONS)}
            className="mb-2"
          >
            ← Voltar
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{transaction.description}</h1>
        </div>

        <div className="flex items-center gap-2">
          <PayTransactionButton transaction={transaction} />
          {transaction.status !== 'CANCELLED' && !isLockedTransaction(transaction) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setEditOpen(true)}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setCancelOpen(true)}
              >
                Cancelar transação
              </Button>
            </>
          )}
          {canReactivateTransaction(transaction) && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px]"
              disabled={reactivating}
              onClick={() => reactivate(transaction.id)}
            >
              Reativar
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="min-h-[44px]"
            onClick={() => setDeleteOpen(true)}
          >
            {isInvoicePayment ? 'Estornar pagamento' : 'Excluir'}
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-b space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-dim">Valor</p>
              <p className="text-sm font-semibold">
                <Money value={Number(transaction.amount)} />
              </p>
            </div>
            <div>
              <p className="text-xs text-dim">Tipo</p>
              <p className="text-sm">{TRANSACTION_TYPE_DISPLAY[transaction.type].label}</p>
            </div>
            <div>
              <p className="text-xs text-dim">Situação</p>
              <p className="text-sm">{TRANSACTION_STATUS_LABELS[transaction.status]}</p>
            </div>
            <div>
              <p className="text-xs text-dim">Competência</p>
              <p className="text-sm">{formatLocalDate(transaction.competenceDate)}</p>
            </div>
            {/* Cancelada não foi paga: a data antiga só confundiria. */}
            {transaction.paymentDate && transaction.status !== 'CANCELLED' && (
              <div>
                <p className="text-xs text-dim">
                  {transaction.status === 'PAID' ? 'Data do pagamento' : 'Vencimento'}
                </p>
                <p className="text-sm">{formatLocalDate(transaction.paymentDate)}</p>
              </div>
            )}
            {transaction.status === 'CANCELLED' && transaction.cancelledAt && (
              <div>
                <p className="text-xs text-dim">Cancelada em</p>
                <p className="text-sm">{formatInstantDate(transaction.cancelledAt)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-dim">Forma de pagamento</p>
              <p className="text-sm">
                {transaction.paymentMethod.name}
                {transaction.creditCard ? ` · ${transaction.creditCard.name}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-dim">Criado em</p>
              <p className="text-sm">{formatInstantDate(transaction.createdAt)}</p>
            </div>
            {isInvoicePayment && transaction.paidInvoiceId && (
              <div>
                <p className="text-xs text-dim">Fatura</p>
                <p className="text-sm">
                  <Link
                    to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', transaction.paidInvoiceId)}
                    className="link"
                  >
                    Ver fatura paga
                  </Link>
                </p>
              </div>
            )}
            {transaction.accountName && (
              <div>
                <p className="text-xs text-dim">Conta</p>
                <p className="text-sm">{transaction.accountName}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-dim">Categoria</p>
              <p className="text-sm">
                {transaction.categoryName
                  ? transaction.subcategoryName
                    ? `${transaction.categoryName} › ${transaction.subcategoryName}`
                    : transaction.categoryName
                  : 'Sem categoria'}
              </p>
            </div>
            {transaction.installmentSeriesId && transaction.installmentNumber != null && (
              <div>
                <p className="text-xs text-dim">Parcela</p>
                <p className="text-sm">
                  {transaction.installmentNumber}/{transaction.totalInstallments ?? '?'}
                </p>
              </div>
            )}
          </div>
          {transaction.notes && (
            <div style={{ marginTop: 8 }}>
              <p className="text-xs text-dim">Notas</p>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <AttachmentSection transactionId={transaction.id} />

      <EditTransactionDialog
        transaction={editOpen ? transaction : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <DeleteTransactionDialog
        transaction={deleteOpen ? transaction : null}
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          void navigate(ROUTES.TRANSACTIONS)
        }}
      />

      <CancelTransactionDialog
        transaction={cancelOpen ? transaction : null}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  )
}

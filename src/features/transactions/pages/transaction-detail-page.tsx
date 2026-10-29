import { useState, type ReactNode } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatInstantDate, formatLocalDate } from '@/lib/format-date'
import { useTransaction } from '@/features/transactions/hooks/use-transaction'
import { AttachmentSection } from '@/features/transactions/components/attachment-section'
import { EditTransactionDialog } from '@/features/transactions/components/edit-transaction-dialog'
import { DeleteTransactionDialog } from '@/features/transactions/components/delete-transaction-dialog'
import { CancelTransactionDialog } from '@/features/transactions/components/cancel-transaction-dialog'
import { PayTransactionButton } from '@/features/transactions/components/pay-transaction-button'
import { useReactivateTransaction } from '@/features/transactions/hooks/use-reactivate-transaction'
import {
  TRANSACTION_TYPE_DISPLAY,
  isPositiveTransaction,
  transactionTypeColor,
} from '@/features/transactions/utils/transaction-type'
import {
  canReactivateTransaction,
  isLockedTransaction,
} from '@/features/transactions/utils/transaction-status'
import { ROUTES } from '@/app/router/routes'

function DetailSkeleton() {
  const bar = 'rounded-md bg-surface-3 animate-pulse motion-reduce:animate-none'
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando transação">
      <div className={`h-5 w-24 ${bar}`} />
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-5">
        <div className={`h-6 w-56 ${bar}`} />
        <div className={`h-9 w-40 ${bar}`} />
      </div>
      <div className={`h-48 !rounded-xl ${bar}`} />
    </div>
  )
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-border py-3 md:border-b-0 md:py-0">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to={ROUTES.TRANSACTIONS}
      className="inline-flex min-h-touch items-center gap-1 self-start rounded-md pr-2 text-body-sm font-medium text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
    >
      <ChevronLeft size={16} aria-hidden="true" />
      Transações
    </Link>
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
      <div className="flex flex-col gap-3">
        <BackLink />
        <h1 className="font-display text-h1 font-extrabold">Transação</h1>
        <div role="alert" className="rounded-xl border border-border bg-surface-1 p-5">
          <p className="text-body text-expense">Falha ao carregar transação.</p>
          <Button className="mt-3" onClick={() => void navigate(ROUTES.TRANSACTIONS)}>
            Voltar para transações
          </Button>
        </div>
      </div>
    )
  }

  const isInvoicePayment = transaction.type === 'INVOICE_PAYMENT'
  const isCancelled = transaction.status === 'CANCELLED'
  const amount = Number(transaction.amount)
  const isPositive = isPositiveTransaction(transaction.type, amount)
  const display = TRANSACTION_TYPE_DISPLAY[transaction.type]
  const canEdit = !isCancelled && !isLockedTransaction(transaction)

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4">
      <BackLink />

      {/* Resumo: o que é, quanto e em que situação */}
      <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface-1 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <IconBubble
            color={transactionTypeColor(transaction.type, amount)}
            icon={display.icon}
            size="lg"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1
              className={`break-words font-display text-h2 font-bold md:text-h1${
                isCancelled ? ' line-through' : ''
              }`}
            >
              {transaction.description}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-fg-muted">
              <StatusBadge status={transaction.status} />
              <span>{display.label}</span>
              {transaction.installmentSeriesId && transaction.installmentNumber != null && (
                <span className="rounded-xs bg-surface-3 px-1.5 py-px font-mono text-caption">
                  {transaction.installmentNumber}/{transaction.totalInstallments ?? '?'}
                </span>
              )}
            </div>
          </div>
        </div>

        <p
          className={`font-display text-[2rem] font-extrabold leading-none md:text-display ${
            isCancelled ? 'text-fg-muted line-through' : isPositive ? 'text-income' : 'text-fg'
          }`}
        >
          <Money value={isPositive ? Math.abs(amount) : -Math.abs(amount)} signed />
        </p>

        {/* Ações: "marcar como paga" em destaque; o resto ao lado. No celular quebram linha. */}
        <div className="flex flex-wrap items-center gap-2">
          <PayTransactionButton transaction={transaction} className="max-md:w-full" />
          {canEdit && (
            <>
              <Button className="min-h-touch" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
              <Button variant="ghost" className="min-h-touch" onClick={() => setCancelOpen(true)}>
                Cancelar transação
              </Button>
            </>
          )}
          {canReactivateTransaction(transaction) && (
            <Button
              className="min-h-touch"
              loading={reactivating}
              onClick={() => reactivate(transaction.id)}
            >
              Reativar
            </Button>
          )}
          <Button variant="danger" className="min-h-touch" onClick={() => setDeleteOpen(true)}>
            {isInvoicePayment ? 'Estornar pagamento' : 'Excluir'}
          </Button>
        </div>
      </section>

      {/* Detalhes */}
      <section
        aria-labelledby="tx-detail-h"
        className="rounded-xl border border-border bg-surface-1 p-5 md:p-6"
      >
        <h2 id="tx-detail-h" className="mb-2 font-display text-h2 md:mb-4">
          Detalhes
        </h2>
        <dl className="[display:grid] grid-cols-1 md:grid-cols-3 md:gap-x-6 md:gap-y-5">
          <DetailItem label="Competência">{formatLocalDate(transaction.competenceDate)}</DetailItem>
          {/* Cancelada não foi paga: a data antiga só confundiria. */}
          {transaction.paymentDate && !isCancelled && (
            <DetailItem label={transaction.status === 'PAID' ? 'Data do pagamento' : 'Vencimento'}>
              {formatLocalDate(transaction.paymentDate)}
            </DetailItem>
          )}
          {isCancelled && transaction.cancelledAt && (
            <DetailItem label="Cancelada em">
              {formatInstantDate(transaction.cancelledAt)}
            </DetailItem>
          )}
          <DetailItem label="Forma de pagamento">
            {transaction.paymentMethod.name}
            {transaction.creditCard ? ` · ${transaction.creditCard.name}` : ''}
          </DetailItem>
          {transaction.accountName && (
            <DetailItem label="Conta">{transaction.accountName}</DetailItem>
          )}
          <DetailItem label="Categoria">
            {transaction.categoryName ? (
              transaction.subcategoryName ? (
                `${transaction.categoryName} › ${transaction.subcategoryName}`
              ) : (
                transaction.categoryName
              )
            ) : (
              <span className="text-fg-muted">Sem categoria</span>
            )}
          </DetailItem>
          {isInvoicePayment && transaction.paidInvoiceId && (
            <DetailItem label="Fatura">
              <Link
                to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', transaction.paidInvoiceId)}
                className="link"
              >
                Ver fatura paga
              </Link>
            </DetailItem>
          )}
          <DetailItem label="Criado em">{formatInstantDate(transaction.createdAt)}</DetailItem>
        </dl>
        {transaction.notes && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-caption text-fg-muted">Observações</p>
            <p className="mt-1 whitespace-pre-wrap text-body">{transaction.notes}</p>
          </div>
        )}
      </section>

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

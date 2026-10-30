import { useState } from 'react'
import { Landmark, RefreshCw, Trash2 } from 'lucide-react'
import { Badge, type BadgeKind } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useBankConnections } from '@/features/bank-connections/hooks/use-bank-connections'
import {
  useConnectToken,
  useDeleteBankConnection,
  useLinkBankAccount,
  useRefreshBankConnection,
  useRegisterBankConnection,
} from '@/features/bank-connections/hooks/use-bank-connection-mutations'
import { toast } from '@/lib/toast'
import { PluggyConnectWidget } from './pluggy-connect-widget'
import type { BankConnection, BankConnectionAccount } from '@/features/bank-connections/types'

const CARD = 'rounded-xl border border-border bg-surface-1 shadow-1'

const STATUS: Record<string, { label: string; kind: BadgeKind }> = {
  UPDATED: { label: 'Atualizada', kind: 'paid' },
  UPDATING: { label: 'Atualizando', kind: 'info' },
  WAITING_USER_INPUT: { label: 'Aguardando você', kind: 'pending' },
  OUTDATED: { label: 'Desatualizada', kind: 'pending' },
  LOGIN_ERROR: { label: 'Precisa reconectar', kind: 'overdue' },
}

/** Status em que só um novo consentimento no widget resolve. */
const NEEDS_RECONNECT = new Set(['LOGIN_ERROR', 'OUTDATED', 'WAITING_USER_INPUT'])

function formatDateTime(instant: string): string {
  return new Date(instant).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface WidgetState {
  token: string
  updateItem?: string
}

export function BankConnectionsSection() {
  const { data, isLoading } = useBankConnections()
  const connectToken = useConnectToken()
  const register = useRegisterBankConnection()
  const [widget, setWidget] = useState<WidgetState | null>(null)
  const [deleting, setDeleting] = useState<BankConnection | null>(null)

  // Sem credenciais no servidor a integração não existe para o usuário.
  if (isLoading || !data?.enabled) return null

  function openWidget(connection?: BankConnection) {
    connectToken.mutate(connection?.id, {
      onSuccess: (token) => setWidget({ token, updateItem: connection?.itemId }),
    })
  }

  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="bank-connections-title">
      <div className="flex items-center gap-2">
        <h2 id="bank-connections-title" className="font-display text-h2 text-fg">
          Conexões bancárias
        </h2>
        <div className="spacer" />
        <Button
          size="sm"
          variant="primary"
          loading={connectToken.isPending && connectToken.variables === undefined}
          leading={<Landmark size={16} aria-hidden="true" />}
          onClick={() => openWidget()}
        >
          Conectar banco
        </Button>
      </div>

      {data.connections.length === 0 ? (
        <p className={`${CARD} px-4 py-4 text-body-sm text-fg-muted`}>
          Conecte seu banco pelo Open Finance para buscar extrato e fatura sem baixar arquivo.
        </p>
      ) : (
        data.connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            reconnecting={connectToken.isPending && connectToken.variables === connection.id}
            onReconnect={() => openWidget(connection)}
            onDelete={() => setDeleting(connection)}
          />
        ))
      )}

      {widget && (
        <PluggyConnectWidget
          connectToken={widget.token}
          updateItem={widget.updateItem}
          onSuccess={(itemId) => register.mutate(itemId)}
          onError={(message) => toast.error(message)}
          onClose={() => setWidget(null)}
        />
      )}

      {deleting && (
        <DeleteConnectionDialog connection={deleting} onClose={() => setDeleting(null)} />
      )}
    </section>
  )
}

interface ConnectionCardProps {
  connection: BankConnection
  reconnecting: boolean
  onReconnect: () => void
  onDelete: () => void
}

function ConnectionCard({ connection, reconnecting, onReconnect, onDelete }: ConnectionCardProps) {
  const refresh = useRefreshBankConnection()
  const status = STATUS[connection.status] ?? { label: connection.status, kind: 'muted' }
  const name = connection.connectorName ?? 'Banco'

  return (
    <div className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body font-semibold text-fg">{name}</span>
        <Badge kind={status.kind}>{status.label}</Badge>
        <div className="spacer" />
        {NEEDS_RECONNECT.has(connection.status) && (
          <Button size="sm" loading={reconnecting} onClick={onReconnect}>
            Reconectar
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Atualizar ${name}`}
          loading={refresh.isPending}
          onClick={() => refresh.mutate(connection.id)}
        >
          <RefreshCw size={16} aria-hidden="true" />
        </Button>
        <Button size="icon" variant="ghost" aria-label={`Remover ${name}`} onClick={onDelete}>
          <Trash2 size={16} aria-hidden="true" />
        </Button>
      </div>
      {(connection.lastSyncedAt || connection.statusDetail) && (
        <p className="text-caption text-fg-muted">
          {connection.lastSyncedAt &&
            `Última atualização com o banco: ${formatDateTime(connection.lastSyncedAt)}`}
          {connection.statusDetail && (
            <span className="block text-overdue">{connection.statusDetail}</span>
          )}
        </p>
      )}
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={`Contas de ${name}`}>
        {connection.accounts.map((account) => (
          <AccountLinkRow key={account.id} connectionId={connection.id} account={account} />
        ))}
      </ul>
    </div>
  )
}

function AccountLinkRow({
  connectionId,
  account,
}: {
  connectionId: string
  account: BankConnectionAccount
}) {
  const isCard = account.kind === 'CREDIT'
  const { data: accounts } = useAccounts()
  const { data: cards } = useCards()
  const link = useLinkBankAccount()
  const current = (isCard ? account.creditCardId : account.accountId) ?? ''
  // Arquivadas não aparecem, a não ser a que já está vinculada.
  const options = isCard
    ? (cards ?? []).map((card) => ({ id: card.id, name: card.name, archived: false }))
    : (accounts ?? []).map((a) => ({ id: a.id, name: a.name, archived: a.archivedAt !== null }))
  const selectId = `link-${account.id}`
  const label = account.number ? `${account.name} · ${account.number}` : account.name

  return (
    <li className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor={selectId} className="flex min-w-0 flex-1 items-center gap-2">
        <Badge kind="muted" dot={false}>
          {isCard ? 'Cartão' : 'Conta'}
        </Badge>
        <span className="truncate text-body-sm text-fg">{label}</span>
      </label>
      <Select
        id={selectId}
        className="sm:w-56"
        value={current}
        disabled={link.isPending}
        onChange={(event) => {
          const target = event.target.value || null
          link.mutate({
            connectionId,
            bankAccountId: account.id,
            data: isCard
              ? { accountId: null, creditCardId: target }
              : { accountId: target, creditCardId: null },
          })
        }}
      >
        <option value="">Não vinculada</option>
        {options
          .filter((option) => !option.archived || option.id === current)
          .map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
      </Select>
    </li>
  )
}

function DeleteConnectionDialog({
  connection,
  onClose,
}: {
  connection: BankConnection
  onClose: () => void
}) {
  const remove = useDeleteBankConnection()

  return (
    <Modal
      alert
      title="Remover conexão"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            loading={remove.isPending}
            onClick={() => remove.mutate(connection.id, { onSuccess: onClose })}
          >
            Remover
          </Button>
        </>
      }
    >
      <p>
        O app deixa de acessar <strong>{connection.connectorName ?? 'este banco'}</strong> e o
        consentimento é revogado na Pluggy. Os lançamentos já importados continuam.
      </p>
    </Modal>
  )
}

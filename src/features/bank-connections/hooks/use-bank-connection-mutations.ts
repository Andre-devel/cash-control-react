import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createConnectToken,
  deleteBankConnection,
  linkBankAccount,
  refreshBankConnection,
  registerBankConnection,
} from '@/features/bank-connections/api/bank-connections.api'
import { toast } from '@/lib/toast'
import { BANK_CONNECTIONS_QUERY_KEY } from './use-bank-connections'
import type { BankConnection, LinkBankAccountRequest } from '@/features/bank-connections/types'
import type { NormalizedError } from '@/features/auth/types'

// Nada aqui move dinheiro: só a lista de conexões fica desatualizada.

function showError(error: NormalizedError) {
  toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
}

export function useConnectToken() {
  return useMutation<string, NormalizedError, string | undefined>({
    mutationFn: (connectionId) => createConnectToken(connectionId),
    onError: showError,
  })
}

export function useRegisterBankConnection() {
  const queryClient = useQueryClient()
  return useMutation<BankConnection, NormalizedError, string>({
    mutationFn: registerBankConnection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY })
      toast.success('Banco conectado. Vincule as contas abaixo.')
    },
    onError: showError,
  })
}

export function useRefreshBankConnection() {
  const queryClient = useQueryClient()
  return useMutation<BankConnection, NormalizedError, string>({
    mutationFn: refreshBankConnection,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY }),
    onError: showError,
  })
}

interface LinkVariables {
  connectionId: string
  bankAccountId: string
  data: LinkBankAccountRequest
}

export function useLinkBankAccount() {
  const queryClient = useQueryClient()
  return useMutation<BankConnection, NormalizedError, LinkVariables>({
    mutationFn: ({ connectionId, bankAccountId, data }) =>
      linkBankAccount(connectionId, bankAccountId, data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY }),
    onError: showError,
  })
}

export function useDeleteBankConnection() {
  const queryClient = useQueryClient()
  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteBankConnection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY })
      toast.success('Conexão removida.')
    },
    onError: showError,
  })
}

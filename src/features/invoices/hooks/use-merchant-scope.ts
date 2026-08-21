import { useQuery } from '@tanstack/react-query'
import { getMerchantScope } from '@/features/invoices/api/invoices.api'

/** Carregada quando o diálogo de edição abre, para saber o N do "aplicar aos outros N
 * lançamentos" antes de mostrar o checkbox. */
export function useMerchantScope(itemId: string | null) {
  return useQuery({
    queryKey: ['invoices', 'items', itemId, 'merchant'],
    queryFn: () => getMerchantScope(itemId as string),
    enabled: !!itemId,
  })
}

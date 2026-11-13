import type { Account } from '@/features/accounts/types'

/** Valor de `accounts` na URL que pede todas as contas, sem cair na seleção padrão. */
export const ALL_ACCOUNTS = 'all'

const STORAGE_KEY = 'cc.transactions.accounts'

/**
 * A conta principal: a primeira conta corrente ativa na ordem da tela de Contas. Sem conta
 * corrente, a primeira conta ativa. É o recorte com que a lista abre na primeira visita.
 */
export function principalAccount(accounts: Account[]): Account | undefined {
  const active = accounts
    .filter((a) => a.archivedAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return active.find((a) => a.type === 'CHECKING') ?? active[0]
}

/** A seleção guardada neste aparelho, só com as contas que ainda existem. */
export function storedAccountSelection(accounts: Account[]): string[] | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null
  if (raw === ALL_ACCOUNTS) return []
  try {
    const ids = JSON.parse(raw) as unknown
    if (!Array.isArray(ids)) return null
    const known = new Set(accounts.map((a) => a.id))
    const kept = ids.filter((id): id is string => typeof id === 'string' && known.has(id))
    return kept.length > 0 ? kept : null
  } catch {
    return null
  }
}

/** Guarda a escolha do usuário; lista vazia é "todas as contas". */
export function storeAccountSelection(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, ids.length === 0 ? ALL_ACCOUNTS : JSON.stringify(ids))
  } catch {
    // Navegação privada ou armazenamento bloqueado: a escolha vale só pela URL.
  }
}

/**
 * As contas do filtro: as da URL quando ela diz; senão a escolha guardada; senão a conta
 * principal. Lista vazia é "todas". `null` enquanto as contas não carregaram e a URL não
 * resolve sozinha — a lista espera em vez de abrir com todas e trocar em seguida.
 */
export function resolveAccountSelection(
  searchParams: URLSearchParams,
  accounts: Account[] | undefined,
): string[] | null {
  const fromUrl = searchParams.getAll('accountId')
  if (fromUrl.length > 0) return fromUrl
  if (searchParams.get('accounts') === ALL_ACCOUNTS) return []
  if (!accounts) return null
  const stored = storedAccountSelection(accounts)
  if (stored) return stored
  const principal = principalAccount(accounts)
  return principal ? [principal.id] : []
}

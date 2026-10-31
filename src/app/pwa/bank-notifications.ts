/**
 * Notificações de lançamento do banco (etapa 6A), do lado do service worker. O servidor manda
 * o texto pronto; aqui se monta a notificação e se responde aos botões. As dependências do
 * service worker entram por parâmetro, para o módulo ser testado sem um.
 */

export interface PendingPush {
  type: 'pending'
  pendingId: string
  /** Token de uso único que autoriza o Confirmar sem sessão (o service worker não tem uma). */
  token: string
  title: string
  body: string
}

export interface SummaryPush {
  type: 'summary'
  count: number
  title: string
  body: string
}

/** Categoria chegando a 80% ou passando do teto do mês; tocar abre os orçamentos. */
export interface BudgetPush {
  type: 'budget'
  categoryId: string
  title: string
  body: string
}

export type BankPush = PendingPush | SummaryPush | BudgetPush

/** `actions` e `renotify` existem no Chrome, mas não na lib DOM do TypeScript. */
export interface BankNotificationOptions {
  body: string
  icon: string
  tag: string
  data?: BankPush
  renotify?: boolean
  actions?: { action: string; title: string }[]
}

interface WindowLike {
  url: string
  focus(): Promise<unknown>
  navigate(url: string): Promise<unknown>
}

interface BankNotificationDeps {
  apiBaseUrl: string
  origin: string
  fetch: typeof fetch
  showNotification: (title: string, options: BankNotificationOptions) => Promise<void>
  clients: {
    matchAll(options: {
      type: 'window'
      includeUncontrolled: boolean
    }): Promise<readonly WindowLike[]>
    openWindow(url: string): Promise<unknown>
  }
}

export const REVIEW_PATH = '/revisar'
export const BUDGETS_PATH = '/budgets'
/** Uma notificação-resumo só: a próxima a substitui. */
export const SUMMARY_TAG = 'bank-pending-summary'
const ICON = '/icons/icon-192.png'

export function notificationOf(data: BankPush): BankNotificationOptions {
  if (data.type === 'budget') {
    // Uma por categoria: o aviso de 100% substitui o de 80%.
    return { body: data.body, icon: ICON, tag: `budget-${data.categoryId}`, renotify: true, data }
  }
  return data.type === 'pending'
    ? {
        body: data.body,
        icon: ICON,
        tag: data.pendingId,
        data,
        actions: [
          { action: 'confirm', title: 'Confirmar' },
          { action: 'review', title: 'Revisar' },
        ],
      }
    : {
        body: data.body,
        icon: ICON,
        tag: SUMMARY_TAG,
        renotify: true,
        data,
        actions: [{ action: 'review', title: 'Revisar' }],
      }
}

export function createBankNotifications(deps: BankNotificationDeps) {
  async function openPath(path: string): Promise<void> {
    const url = new URL(path, deps.origin).href
    const windows = await deps.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = windows.find((client) => new URL(client.url).origin === deps.origin)
    if (open) {
      await open.focus()
      await open.navigate(url)
      return
    }
    await deps.clients.openWindow(url)
  }

  const openReview = () => openPath(REVIEW_PATH)

  async function confirm(data: PendingPush): Promise<void> {
    try {
      const response = await deps.fetch(
        `${deps.apiBaseUrl}/bank-pending/${data.pendingId}/confirm-by-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token }),
        },
      )
      if (!response.ok) {
        // Token vencido ou lançamento já resolvido por outro caminho: a fila decide.
        await openReview()
        return
      }
      const saved = (await response.json()) as { description: string; categoryName: string | null }
      await deps.showNotification('✓ Gravado', {
        body: saved.categoryName
          ? `${saved.description} · ${saved.categoryName}`
          : saved.description,
        icon: ICON,
        tag: data.pendingId,
      })
    } catch {
      await openReview()
    }
  }

  return {
    show: (data: BankPush) => deps.showNotification(data.title, notificationOf(data)),
    /**
     * Botão Confirmar grava sem abrir o app; o resto (Revisar, tocar no corpo) abre a fila.
     * O alerta de orçamento abre a página de orçamentos.
     */
    click: (action: string, data: BankPush | undefined) =>
      data?.type === 'budget'
        ? openPath(BUDGETS_PATH)
        : action === 'confirm' && data?.type === 'pending'
          ? confirm(data)
          : openReview(),
  }
}

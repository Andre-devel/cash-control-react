import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string, correlationId?: string) => {
    if (correlationId) {
      sonnerToast.error(message, { description: `Ref: ${correlationId}` })
    } else {
      sonnerToast.error(message)
    }
  },
  warn: (message: string, description?: string) => {
    if (description) {
      sonnerToast.warning(message, { description })
    } else {
      sonnerToast.warning(message)
    }
  },
  info: (message: string) => sonnerToast.info(message),
  /**
   * Aviso com um botão de ação. Com `id`, um aviso novo substitui o anterior de mesmo id
   * em vez de empilhar.
   */
  action: (
    message: string,
    action: { label: string; onClick: () => void },
    options?: { id?: string; duration?: number },
  ) => sonnerToast.message(message, { ...options, action }),
}

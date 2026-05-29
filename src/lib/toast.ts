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
  warn: (message: string, correlationId?: string) => {
    if (correlationId) {
      sonnerToast.warning(message, { description: `Ref: ${correlationId}` })
    } else {
      sonnerToast.warning(message)
    }
  },
  info: (message: string) => sonnerToast.info(message),
}

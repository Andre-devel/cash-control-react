import type { UseFormSetError, FieldValues } from 'react-hook-form'
import { toast } from './toast'
import type { NormalizedError } from '@/features/auth/types'

/**
 * Maps server-side field errors from a NormalizedError onto a React Hook Form's setError.
 * When fieldErrors are present, each field gets its server message.
 * When absent (e.g. a 409 conflict with only a top-level message), sets form root error.
 */
export function setFormErrors<T extends FieldValues>(
  error: NormalizedError,
  setError: UseFormSetError<T>,
): void {
  const entries = error.fieldErrors ? Object.entries(error.fieldErrors) : []
  if (entries.length > 0) {
    for (const [field, message] of entries) {
      setError(field as Parameters<typeof setError>[0], { type: 'server', message })
    }
  } else {
    setError('root' as Parameters<typeof setError>[0], { type: 'server', message: error.message })
  }
}

/**
 * Erro que o formulário deve mostrar nos campos em vez de num toast: validação do bean (400
 * com `fieldErrors`), conflito (409) ou regra de negócio (422).
 */
export function isFormError(error: NormalizedError): boolean {
  const hasFieldErrors = !!error.fieldErrors && Object.keys(error.fieldErrors).length > 0
  return hasFieldErrors || error.status === 409 || error.status === 422
}

/** `onError` padrão das mutações de formulário: erro de campo vai para o form, o resto é toast. */
export function reportMutationError(
  error: NormalizedError,
  onFieldError?: (error: NormalizedError) => void,
): void {
  if (onFieldError && isFormError(error)) {
    onFieldError(error)
    return
  }
  toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
}

export interface MutationFormOptions {
  /** Recebe os erros de campo (ver `isFormError`); sem ele, todo erro vira toast. */
  onFieldError?: (error: NormalizedError) => void
}

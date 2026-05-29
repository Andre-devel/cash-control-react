import type { UseFormSetError, FieldValues } from 'react-hook-form'
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

import type { KeyboardEvent } from 'react'

/** ⌘↵ / Ctrl+↵ salva o formulário (atalho de teclado do desktop). */
export function submitOnModEnter(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    e.currentTarget.requestSubmit()
  }
}

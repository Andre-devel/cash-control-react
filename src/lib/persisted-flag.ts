/**
 * Preferência liga/desliga guardada no `localStorage`, por aparelho. Sem armazenamento
 * (navegação privada, bloqueio), lê como desligada e vale só para a sessão.
 */
export function readFlag(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

export function storeFlag(storageKey: string, on: boolean) {
  try {
    localStorage.setItem(storageKey, on ? '1' : '0')
  } catch {
    // Navegação privada ou armazenamento bloqueado: vale só para esta sessão.
  }
}

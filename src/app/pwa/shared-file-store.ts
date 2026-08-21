/**
 * Ponte entre o service worker e a página React para um arquivo compartilhado via
 * Web Share Target.
 *
 * Existe porque o `AuthGuard` (`src/app/router/guards/auth-guard.tsx`) redireciona uma
 * navegação não autenticada para `/login?redirect=...`, preservando só `pathname + search`
 * — o corpo de um POST de share target seria perdido nesse desvio. O service worker
 * intercepta o POST antes de qualquer código React rodar e estaciona o arquivo aqui; depois
 * do login (ou direto, se já autenticado), `/share-target` o recupera intacto.
 *
 * IndexedDB, não `localStorage`: um `Blob` não cabe em `localStorage` (só aceita string) e
 * o service worker não tem acesso a `window` para usar `postMessage` de forma síncrona com
 * o redirect que ele já precisa fazer.
 */

const DB_NAME = 'cash-control-share-target'
const DB_VERSION = 1
const STORE_NAME = 'pending'
/** Chave fixa: só existe um comprovante pendente por vez — o próximo compartilhamento sobrescreve. */
const KEY = 'latest'

interface StoredShare {
  file: Blob
  fileName: string
  text: string | null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Chamado pelo service worker (`src/sw.ts`) ao interceptar o POST do share target. */
export async function stashSharedFile(
  file: Blob,
  fileName: string,
  text: string | null,
): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ file, fileName, text } satisfies StoredShare, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/**
 * Chamado por `share-target-page.tsx` ao montar. Lê e apaga na mesma operação — um
 * comprovante pendente é consumido uma vez só, mesmo que a página seja recarregada depois.
 */
export async function takeSharedFile(): Promise<{ file: File; text: string | null } | null> {
  const db = await openDb()
  const stored = await new Promise<StoredShare | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getRequest = store.get(KEY)
    getRequest.onsuccess = () => {
      const value = getRequest.result as StoredShare | undefined
      if (value) store.delete(KEY)
      resolve(value)
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
  db.close()

  if (!stored) return null
  return {
    file: new File([stored.file], stored.fileName, { type: stored.file.type }),
    text: stored.text,
  }
}

/**
 * Entrega um blob ao navegador como download.
 *
 * Arquivos protegidos vêm por axios (o bearer não vai num `<a href>`), então o conteúdo
 * chega como blob e é salvo por um link temporário.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revogar no mesmo tick cancela o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

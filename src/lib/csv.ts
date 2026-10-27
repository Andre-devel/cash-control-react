/**
 * CSV no formato que o Excel pt-BR abre direto: `;` entre colunas, vírgula decimal e BOM
 * UTF-8 (sem ele os acentos viram lixo).
 */
export function buildCsvBlob(rows: (string | number)[][]): Blob {
  const csv = rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
  return new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
}

/** Decimal da API (`1234.5`) para célula de planilha pt-BR (`1234,50`). */
export function csvMoney(value: string | number): string {
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : ''
}

function escapeCell(cell: string | number): string {
  const text = String(cell)
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

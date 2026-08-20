interface ImportRowErrorLike {
  lineNumber: number
  message: string
}

/** Resume os erros de linha de uma importação (fatura/extrato) para exibir como detalhe do toast. */
export function describeErrors(errors: ImportRowErrorLike[]): string | undefined {
  if (errors.length === 0) {
    return undefined
  }
  const summary = errors
    .slice(0, 3)
    .map((error) => `linha ${error.lineNumber} (${error.message})`)
    .join('; ')
  return errors.length > 3 ? `${summary}…` : summary
}

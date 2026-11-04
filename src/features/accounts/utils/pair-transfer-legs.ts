import type { Transaction } from '@/features/transactions/types'

/** Uma transferência entre contas, com as duas pernas já juntas. */
export interface TransferPair {
  /** Id da perna de saída (ou da única perna, quando a outra não veio na página). */
  id: string
  fromAccountName: string | null
  toAccountName: string | null
  /** Valor positivo transferido. */
  amount: number
  description: string
  competenceDate: string
}

function legKey(leg: Transaction): string {
  return `${leg.competenceDate}|${Math.abs(Number(leg.amount)).toFixed(2)}|${leg.description}`
}

/**
 * Junta as duas pernas de cada transferência numa linha só. A perna de saída tem valor
 * negativo e a de entrada, positivo; as duas nascem juntas (mesma data, valor e descrição,
 * contas diferentes). A listagem de transações não expõe o id do grupo da transferência,
 * então o par é reconhecido por esses campos. Uma perna sem par na página aparece sozinha,
 * com o lado que falta em branco.
 *
 * Mantém a ordem da lista recebida (a da primeira perna de cada par).
 */
export function pairTransferLegs(legs: Transaction[]): TransferPair[] {
  const used = new Set<string>()
  const pairs: TransferPair[] = []

  for (const leg of legs) {
    if (used.has(leg.id)) continue
    used.add(leg.id)

    const outgoing = Number(leg.amount) < 0
    const key = legKey(leg)
    const other = legs.find(
      (candidate) =>
        !used.has(candidate.id) &&
        candidate.accountId !== leg.accountId &&
        Number(candidate.amount) < 0 !== outgoing &&
        legKey(candidate) === key,
    )
    if (other) used.add(other.id)

    const source = outgoing ? leg : other
    const destination = outgoing ? other : leg

    pairs.push({
      id: (source ?? leg).id,
      fromAccountName: source?.accountName ?? null,
      toAccountName: destination?.accountName ?? null,
      amount: Math.abs(Number(leg.amount)),
      description: leg.description,
      competenceDate: leg.competenceDate,
    })
  }

  return pairs
}

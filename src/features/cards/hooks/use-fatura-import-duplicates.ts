import { useQueries } from '@tanstack/react-query'
import { checkFaturaImportDuplicates } from '@/features/cards/api/fatura-import.api'
import type { FaturaImportGroupPreview } from '@/features/cards/types'

/** Uma consulta por seção do PDF que já tem cartão escolhido, indexada por `cardLast4`. */
export type FaturaImportDuplicatesByGroup = Record<string, Set<string>>

interface DuplicatesResult {
  /**
   * Só traz o grupo cuja consulta já respondeu. Ausente significa que a marca da prévia
   * é a que vale — inclusive quando o usuário volta ao cartão sugerido.
   */
  byGroup: FaturaImportDuplicatesByGroup
  /** Grupos com consulta em andamento, por `cardLast4`. */
  fetchingByGroup: Record<string, boolean>
}

/**
 * As linhas já importadas de cada seção, recalculadas contra o cartão escolhido no diálogo.
 *
 * <p>A prévia só consegue marcar duplicatas dos grupos cujos 4 dígitos casaram com um cartão
 * cadastrado. Num cartão virtual — escolhido à mão — ela não marca nada, e o usuário só
 * descobriria o que já entrou na hora de confirmar. Uma consulta por grupo mantém a
 * marcação alinhada ao cartão que está selecionado naquele momento.
 */
export function useFaturaImportDuplicates(
  groups: FaturaImportGroupPreview[],
  referenceMonth: string | undefined,
  cardByGroup: Record<string, string>,
): DuplicatesResult {
  const targets = groups
    .map((group) => ({
      cardLast4: group.cardLast4,
      creditCardId: cardByGroup[group.cardLast4] ?? '',
      // O cartão que a própria prévia sugeriu já foi consultado lá: perguntar de novo
      // seria a mesma resposta. Só o cartão escolhido à mão precisa de consulta.
      needsCheck:
        (cardByGroup[group.cardLast4] ?? '') !== '' &&
        cardByGroup[group.cardLast4] !== group.suggestedCreditCardId,
      externalRefs: group.rows.map((row) => row.externalRef),
    }))
    .filter((target) => target.needsCheck && target.externalRefs.length > 0)

  return useQueries({
    queries: targets.map((target) => ({
      // Os refs entram na chave porque identificam o arquivo: analisar outro PDF para o
      // mesmo cartão e mês não pode reaproveitar a resposta do anterior.
      queryKey: [
        'cards',
        'fatura-import-duplicates',
        target.creditCardId,
        referenceMonth,
        target.externalRefs,
      ],
      queryFn: () =>
        checkFaturaImportDuplicates({
          creditCardId: target.creditCardId,
          referenceMonth: referenceMonth as string,
          externalRefs: target.externalRefs,
        }),
      enabled: Boolean(referenceMonth),
      // O diálogo é curto e a resposta muda assim que uma importação grava: sem cache
      // entre aberturas, para não mostrar como pendente o que acabou de entrar.
      staleTime: 0,
      gcTime: 0,
      retry: false,
    })),
    combine: (results) => ({
      byGroup: Object.fromEntries(
        results.flatMap((result, index) =>
          result.data
            ? [[targets[index].cardLast4, new Set(result.data.duplicateExternalRefs)] as const]
            : [],
        ),
      ),
      fetchingByGroup: Object.fromEntries(
        results.map((result, index) => [targets[index].cardLast4, result.isFetching]),
      ),
    }),
  })
}

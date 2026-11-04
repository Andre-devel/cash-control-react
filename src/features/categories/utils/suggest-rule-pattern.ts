/**
 * Descrições que não dizem quem está do outro lado: o banco põe o mesmo texto em todo Pix ou
 * pagamento, e quem identifica o lançamento é a contraparte.
 */
const GENERIC_DESCRIPTION = /^(PIX (ENVIADO|RECEBIDO)|PAGAMENTO)\b/

/**
 * Palavras de ≥ 4 letras que o banco acrescenta à descrição e não identificam o
 * estabelecimento: uma regra com elas casaria com quase tudo.
 */
const NOISE_WORDS = new Set(['PARC', 'PARCELA', 'COMPRA', 'ENVIADO', 'RECEBIDO', 'PAGAMENTO'])

/** Países que o Inter põe no fim da linha do cartão (`OSASCO BRA`). */
const TRAILING_COUNTRY = /\s+(BRA|BR|USA|US|IRL|GBR|NLD|CAN)$/

const BRAZILIAN_STATES =
  'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO'
const TRAILING_STATE = new RegExp(`\\s+(${BRAZILIAN_STATES})$`)

const MIN_LETTERS = 4

function letterCount(word: string): number {
  return word.match(/\p{L}/gu)?.length ?? 0
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Descrição sem o que muda de um lançamento para outro do mesmo estabelecimento: parcelas,
 * datas, números, `*` e o local (cidade/UF/país) no fim.
 *
 * Números e pontuação viram espaço, em vez de sumir, para que cada palavra que sobra continue
 * sendo um trecho contíguo do texto original — é por "contém" que a regra casa.
 */
function normalizeDescription(description: string): string {
  let text = description.toUpperCase()
  text = text.replace(/\(?\bPARCELA\s+\d+\s+DE\s+\d+\)?/g, ' ')
  text = text.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, ' ')
  text = text.replace(/\b\d+\/\d+\b/g, ' ')
  text = text.replace(/[^\p{L}\s]/gu, ' ')
  text = collapse(text)

  const withoutCountry = text.replace(TRAILING_COUNTRY, '')
  if (withoutCountry !== text) {
    text = withoutCountry.replace(TRAILING_STATE, '')
    // Antes do país vem a cidade; só sai se sobrar alguma coisa além dela.
    const words = text.split(' ')
    if (words.length > 1) text = words.slice(0, -1).join(' ')
  } else {
    const withoutState = text.replace(TRAILING_STATE, '')
    if (withoutState.includes(' ')) text = withoutState
  }
  return text
}

/**
 * Padrão proposto para uma regra de categorização criada a partir da linha que o usuário
 * acabou de corrigir. A regra casa por "contém", sem diferenciar maiúsculas, na descrição
 * ou na contraparte (`CategoryRuleMatcher` na API).
 *
 * Ex.: `MERCADOLIVRE*MERCADOL OSASCO BRA` → `MERCADOLIVRE`; `PIX ENVIADO` com contraparte
 * "Fulano de Tal" → `FULANO DE TAL`.
 *
 * @returns `null` quando a linha não deixa nada que identifique o estabelecimento.
 */
export function suggestRulePattern(
  description: string,
  counterpartyName?: string | null,
): string | null {
  const counterparty = counterpartyName ? collapse(counterpartyName.toUpperCase()) : ''
  const normalized = normalizeDescription(description)

  if (counterparty && GENERIC_DESCRIPTION.test(normalized)) return counterparty

  const word = normalized
    .split(' ')
    .find((w) => letterCount(w) >= MIN_LETTERS && !NOISE_WORDS.has(w))
  return word ?? (counterparty || null)
}

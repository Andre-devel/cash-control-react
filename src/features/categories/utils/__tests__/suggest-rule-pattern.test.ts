import { describe, it, expect } from 'vitest'
import { suggestRulePattern } from '../suggest-rule-pattern'

describe('suggestRulePattern', () => {
  // Descrições reais do extrato e da fatura do Inter.
  it.each([
    ['MERCADOLIVRE*MERCADOL OSASCO BRA', 'MERCADOLIVRE'],
    ['MERCADOLIVRE*MELI', 'MERCADOLIVRE'],
    ['IFD*IFOOD.COM AGENCIA DE RESTAURANTE OSASCO BRA', 'IFOOD'],
    ['UBER *TRIP HELP.UBER.COM SAO PAULO BRA', 'UBER'],
    ['ANTHROPIC* CLAUDE SUB', 'ANTHROPIC'],
    ['SHOPEE *LarkSpComercio (Parcela 04 de 05)', 'SHOPEE'],
    ['CP PARC SHOPPING INTER (Parcela 01 de 10)', 'SHOPPING'],
    ['Sorveteka Penapolis Bra', 'SORVETEKA'],
    ['PADARIA SAO JOAO', 'PADARIA'],
    ['NETFLIX.COM SAO PAULO SP BRA', 'NETFLIX'],
    ['Tarifa Cesta B', 'TARIFA'],
    ['Cdb Porq Obj Banco Inter Sa', 'PORQ'],
  ])('%s → %s', (description, expected) => {
    expect(suggestRulePattern(description)).toBe(expected)
  })

  it('tira datas, parcelas n/m e números antes de escolher a palavra', () => {
    expect(suggestRulePattern('12/10 3/10 99 POSTO IPIRANGA 123')).toBe('POSTO')
  })

  it('não junta letras separadas por dígitos, para o padrão continuar contido na descrição', () => {
    expect(suggestRulePattern('AB12CDEF LOJA')).toBe('CDEF')
  })

  it('não toma a cidade pelo estabelecimento quando o nome é curto', () => {
    expect(suggestRulePattern('PAG*ZE OSASCO BRA')).toBeNull()
  })

  it.each(['PIX ENVIADO', 'Pix recebido', 'PAGAMENTO', 'Pagamento efetuado 12/10'])(
    'descrição genérica "%s" usa o nome da contraparte',
    (description) => {
      expect(suggestRulePattern(description, '  Fulano   de Tal ')).toBe('FULANO DE TAL')
    },
  )

  it('descrição genérica sem contraparte não vira padrão', () => {
    expect(suggestRulePattern('PIX ENVIADO')).toBeNull()
    expect(suggestRulePattern('PAGAMENTO', null)).toBeNull()
  })

  it('descrição com estabelecimento ignora a contraparte', () => {
    expect(suggestRulePattern('PADARIA REAL', 'Padaria Real Ltda')).toBe('PADARIA')
  })

  it('sem nada identificável na descrição, cai na contraparte', () => {
    expect(suggestRulePattern('123 *', 'Dias E Damasceno')).toBe('DIAS E DAMASCENO')
    expect(suggestRulePattern('')).toBeNull()
  })
})

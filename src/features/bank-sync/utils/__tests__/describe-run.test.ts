import { describe, it, expect } from 'vitest'
import {
  accountsLine,
  connectionLabel,
  describeRun,
  durationLabel,
  relativeDay,
  triggerLabel,
} from '../describe-run'
import type { BankSyncRun } from '@/features/bank-sync/types'

function run(overrides: Partial<BankSyncRun>): BankSyncRun {
  return {
    id: 'r1',
    connectionId: 'c1',
    itemId: '8b31a901-3967-4676-93d0-68522c810cab',
    connectorName: 'Inter',
    trigger: 'SCHEDULED',
    webhookEvent: null,
    outcome: 'SUCCESS',
    startedAt: '2026-11-04T17:13:00.000Z',
    finishedAt: '2026-11-04T17:13:02.400Z',
    itemStatus: 'UPDATED',
    itemLastUpdatedAt: null,
    accountsRead: null,
    transactionsQueued: null,
    investmentsCreated: null,
    investmentsRedeemed: null,
    investmentsFailed: null,
    webhookDelayMinutes: null,
    errorMessage: null,
    ...overrides,
  }
}

describe('describeRun', () => {
  it('lists what the run did, skipping zeros', () => {
    expect(
      describeRun(
        run({
          accountsRead: 2,
          transactionsQueued: 1,
          investmentsCreated: 0,
          investmentsRedeemed: 2,
        }),
      ),
    ).toBe('2 contas lidas · 1 lançamento na fila · 2 resgates')
  })

  it('puts the error first on a problem', () => {
    expect(
      describeRun(
        run({
          outcome: 'PARTIAL',
          accountsRead: 1,
          errorMessage: '1 investimento(s) não aplicado(s)',
        }),
      ),
    ).toBe('1 investimento(s) não aplicado(s) — 1 conta lida')
    expect(describeRun(run({ outcome: 'ERROR', errorMessage: 'Pluggy fora do ar' }))).toBe(
      'Pluggy fora do ar',
    )
  })

  it('shows the webhook delay and a dash when nothing happened', () => {
    expect(describeRun(run({ webhookDelayMinutes: 3 }))).toBe('aviso 3 min depois da Pluggy')
    expect(describeRun(run({}))).toBe('—')
  })
})

describe('labels', () => {
  it('names the trigger with the webhook event', () => {
    expect(triggerLabel({ trigger: 'WEBHOOK', webhookEvent: 'transactions/created' })).toBe(
      'Webhook · transactions/created',
    )
    expect(triggerLabel({ trigger: 'SCHEDULED', webhookEvent: null })).toBe('Varredura')
  })

  it('formats duration in seconds', () => {
    expect(durationLabel(run({}))).toBe('2,4 s')
  })

  it('says today, yesterday or the date', () => {
    const now = new Date(2026, 10, 4, 18, 0)
    expect(relativeDay(new Date(2026, 10, 4, 14, 13).toISOString(), now)).toBe('hoje às 14:13')
    expect(relativeDay(new Date(2026, 10, 3, 15, 57).toISOString(), now)).toBe('ontem às 15:57')
    expect(relativeDay(new Date(2026, 10, 2, 18, 13).toISOString(), now)).toBe('02/11 às 18:13')
  })
})

describe('connection names', () => {
  const accounts = [
    {
      id: 'a2',
      kind: 'CREDIT' as const,
      name: 'GOLD',
      number: '7866',
      accountId: null,
      creditCardId: null,
    },
    {
      id: 'a1',
      kind: 'BANK' as const,
      name: 'BANCO INTER',
      number: '32323671-5',
      accountId: null,
      creditCardId: null,
    },
  ]

  it('tells two connections of the same connector apart by the checking account', () => {
    expect(connectionLabel({ connectorName: 'MeuPluggy', itemId: 'x', accounts })).toBe(
      'MeuPluggy ••71-5',
    )
    expect(connectionLabel({ connectorName: null, itemId: '9318d797-aaaa', accounts: [] })).toBe(
      '9318d797',
    )
  })

  it('lists the accounts in one line', () => {
    expect(accountsLine({ accounts })).toBe('GOLD ••7866 · BANCO INTER ••71-5')
  })
})

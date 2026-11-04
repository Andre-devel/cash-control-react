/** Meta de economia como a API devolve, já com o progresso calculado. */
export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  /** `aaaa-mm-dd`; `null` sem prazo. */
  targetDate: string | null
  /** Conta cujo saldo é o valor atual. Exclusivo com `holdingId`. */
  accountId: string | null
  /** Aplicação cujo valor líquido é o valor atual. Exclusivo com `accountId`. */
  holdingId: string | null
  icon: string | null
  color: string | null
  /** Saldo da conta ou líquido da aplicação; 0 sem vínculo. */
  current: number
  /** `current / targetAmount` em %, sem teto em 100. */
  percent: number
  /** Quanto guardar por mês até o prazo; `null` sem prazo, 0 quando já atingiu. */
  monthlyNeeded: number | null
  createdAt: string
  archivedAt: string | null
}

export interface SaveGoalRequest {
  name: string
  /** Decimal com ponto: `20000.00`. */
  targetAmount: string
  targetDate: string | null
  accountId: string | null
  holdingId: string | null
  icon: string | null
  color: string | null
}

/** `aaaa-mm-dd` como `mm/aaaa`, o prazo nos cards. */
export function formatGoalMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso)
  return match ? `${match[2]}/${match[1]}` : iso
}

/** Quanto falta para a meta; nunca negativo. */
export function goalRemaining(goal: { targetAmount: number; current: number }): number {
  return Math.max(goal.targetAmount - goal.current, 0)
}

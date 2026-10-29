// Cores ligadas aos tokens --cc-* (canais RGB) de globals.css.
// `<alpha-value>` habilita modificadores de opacidade do Tailwind (ex.: bg-brand/20).
const cc = (name: string) => `rgb(var(--cc-${name}) / <alpha-value>)`

const semantic = (name: string) => ({
  DEFAULT: cc(name),
  soft: cc(`${name}-soft`),
  solid: cc(`${name}-solid`),
  on: cc(`${name}-on`),
})

export const colors = {
  bg: cc('bg'),
  surface: { 1: cc('surface-1'), 2: cc('surface-2'), 3: cc('surface-3'), hover: cc('surface-2') },
  border: { DEFAULT: cc('border'), strong: cc('border-strong') },
  fg: { DEFAULT: cc('text'), muted: cc('text-muted'), subtle: cc('text-subtle') },
  brand: {
    DEFAULT: cc('brand'),
    ink: cc('brand-ink'),
    text: cc('brand-text'),
    soft: cc('brand-soft'),
  },
  focus: cc('focus'),
  overlay: cc('overlay'),
  income: semantic('income'),
  expense: semantic('expense'),
  paid: semantic('paid'),
  pending: semantic('pending'),
  overdue: semantic('overdue'),
  canceled: semantic('canceled'),
  info: semantic('info'),
  cat: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, cc(`cat-${i + 1}`)])),

  // Nomes anteriores ao redesenho — mantidos até as telas migrarem.
  accent: {
    DEFAULT: cc('brand'),
    hover: 'var(--accent-hover)',
    press: 'var(--accent-press)',
    soft: cc('brand-soft'),
    fg: cc('brand-ink'),
    text: cc('brand-text'),
  },
  text: {
    DEFAULT: cc('text'),
    muted: cc('text-muted'),
    dim: cc('text-muted'),
    faint: cc('text-subtle'),
  },
  cancelled: semantic('canceled'),
} as const

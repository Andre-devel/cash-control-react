export const fontFamily = {
  display: ['var(--cc-font-display)'],
  sans: ['var(--cc-font-sans)'],
  mono: ['var(--cc-font-mono)'],
}

// Escala do design system (Claude Design · Grafite & Menta) + tamanhos utilitários antigos.
export const fontSize = {
  xs: ['11px', { lineHeight: '1.4' }],
  sm: ['12px', { lineHeight: '1.4' }],
  base: ['13px', { lineHeight: '1.5' }],
  // lg…4xl iguais às classes legadas de globals.css, que agora perdem para os utilitários
  lg: ['16px', { lineHeight: '1.5' }],
  xl: ['20px', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
  '2xl': ['26px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
  '3xl': ['32px', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
  '4xl': ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
  display: ['2.625rem', { lineHeight: '1', letterSpacing: '-.025em', fontWeight: '800' }],
  h1: ['1.75rem', { lineHeight: '1.1', letterSpacing: '-.01em', fontWeight: '700' }],
  h2: ['1.1875rem', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '700' }],
  'amount-lg': ['1.1875rem', { lineHeight: '1', letterSpacing: '0', fontWeight: '700' }],
  body: ['0.9375rem', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '500' }],
  'body-sm': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
  caption: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '400' }],
  overline: ['0.6875rem', { lineHeight: '1', letterSpacing: '.06em', fontWeight: '600' }],
}

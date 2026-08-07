import { useEffect, useState } from 'react'

/** Mesmo breakpoint do bloco `@media (max-width: 767px)` de globals.css. */
export const MOBILE_QUERY = '(max-width: 767px)'

function matches(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

/**
 * Reage a uma media query em JS.
 *
 * <p>Usado onde renderizar as duas variantes e esconder uma por CSS não serve —
 * markup duplicado é lido duas vezes por leitor de tela. Em ambiente sem
 * `matchMedia` (jsdom) devolve `false`, ou seja, a variante desktop.
 */
export function useMediaQuery(query: string): boolean {
  const [isMatch, setIsMatch] = useState(() => matches(query))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setIsMatch(e.matches)
    setIsMatch(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return isMatch
}

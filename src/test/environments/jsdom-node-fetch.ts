import type { Environment } from 'vitest/environments'
import { builtinEnvironments } from 'vitest/environments'

const jsdomEnvironment = builtinEnvironments.jsdom

// jsdom's window ships its own AbortController/AbortSignal classes and vitest copies them onto
// globalThis, shadowing Node's native ones. Node's built-in `fetch`/`Request` (backed by undici)
// are left untouched by jsdom, so a signal created via the jsdom AbortController fails the
// `instanceof AbortSignal` brand check inside `new Request(url, { signal })` — this breaks
// react-router navigation (and anything else constructing a native Request with an AbortSignal)
// under MSW, which proxies the global Request constructor.
export default {
  name: 'jsdom-node-fetch',
  transformMode: 'web',
  async setup(global, options) {
    const nativeAbortController = global.AbortController
    const nativeAbortSignal = global.AbortSignal

    const result = await jsdomEnvironment.setup(global, options)

    global.AbortController = nativeAbortController
    global.AbortSignal = nativeAbortSignal

    return result
  },
} satisfies Environment

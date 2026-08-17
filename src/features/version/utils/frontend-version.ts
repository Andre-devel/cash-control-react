import type { FrontendVersion } from '@/features/version/types'

/**
 * Baked in at Docker build time (Dockerfile ARG VITE_GIT_COMMIT/VITE_BUILD_TIME →
 * env → Vite auto-exposes any VITE_-prefixed var). Falls back to 'dev' outside
 * the production image, e.g. `pnpm dev`.
 */
export function getFrontendVersion(): FrontendVersion {
  return {
    commit: import.meta.env.VITE_GIT_COMMIT ?? 'dev',
    buildTime: import.meta.env.VITE_BUILD_TIME ?? 'dev',
  }
}

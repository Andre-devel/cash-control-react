import { useBackendVersion } from '@/features/version/hooks'
import { getFrontendVersion } from '@/features/version/utils'

/** Short commit + build time for both front and back, so a deploy can be confirmed at a glance. */
export function VersionInfo() {
  const frontend = getFrontendVersion()
  const { data: backend, isLoading, isError } = useBackendVersion()

  const backendLabel = isLoading ? '…' : isError ? 'indisponível' : backend?.commit
  const title = [
    `web: ${frontend.commit} (build ${frontend.buildTime})`,
    backend
      ? `api: ${backend.commit} v${backend.version} (build ${backend.buildTime})`
      : 'api: não foi possível carregar a versão',
  ].join('\n')

  return (
    <div className="v" title={title}>
      web {frontend.commit} · api {backendLabel}
    </div>
  )
}

import { http, HttpResponse } from 'msw'
import type { BackendVersion } from '@/features/version/types'

export const MOCK_BACKEND_VERSION: BackendVersion = {
  version: '0.0.1-SNAPSHOT',
  commit: 'test1234',
  buildTime: '2026-01-01T00:00:00Z',
}

export const versionHandlers = [
  http.get('*/version', () => {
    return HttpResponse.json(MOCK_BACKEND_VERSION)
  }),
]

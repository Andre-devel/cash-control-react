import { axiosInstance } from '@/services/http'
import type { BackendVersion } from '@/features/version/types'

export async function getBackendVersion(): Promise<BackendVersion> {
  const response = await axiosInstance.get<BackendVersion>('/version')
  return response.data
}

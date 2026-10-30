import { axiosInstance } from '@/services/http'
import type {
  PushConfig,
  PushDevice,
  PushSubscribeRequest,
} from '@/features/bank-connections/types'

export async function getPushConfig(): Promise<PushConfig> {
  const response = await axiosInstance.get<PushConfig>('/push/vapid-key')
  return response.data
}

export async function listPushDevices(): Promise<PushDevice[]> {
  const response = await axiosInstance.get<PushDevice[]>('/push/subscriptions')
  return response.data
}

export async function subscribePush(data: PushSubscribeRequest): Promise<PushDevice> {
  const response = await axiosInstance.post<PushDevice>('/push/subscriptions', data)
  return response.data
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await axiosInstance.delete('/push/subscriptions', { data: { endpoint } })
}

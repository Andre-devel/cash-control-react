import { axiosInstance } from '@/services/http'
import type { SearchResponse } from '@/features/search/types'

/** Busca global: a API exige `q` com pelo menos 2 caracteres (senão responde 400). */
export async function globalSearch(q: string, signal?: AbortSignal): Promise<SearchResponse> {
  const response = await axiosInstance.get<SearchResponse>('/search', { params: { q }, signal })
  return response.data
}

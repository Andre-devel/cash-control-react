export { getProfile, updateProfile, getConsentHistory } from './api'
export { updateProfileSchema } from './schemas'
export type { UpdateProfileFormValues } from './schemas'
export {
  useProfile,
  useUpdateProfile,
  useConsentHistory,
  PROFILE_QUERY_KEY,
  CONSENT_HISTORY_QUERY_KEY,
} from './hooks'
export { ConsentHistorySection } from './components'
export type { UserProfile, ConsentRecord, UpdateProfileRequest } from './types'

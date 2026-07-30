import type { FeatureFlags } from '@shared'

export interface AppEnv {
  Variables: {
    airtableBaseId: string
    isAdmin: boolean
    featureFlags: FeatureFlags
  }
}

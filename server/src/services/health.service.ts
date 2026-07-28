import { healthResponseSchema, type HealthResponse } from '@shared'

export function getHealthStatus(): HealthResponse {
  return healthResponseSchema.parse({ status: 'ok' })
}

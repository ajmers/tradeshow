import { Hono } from 'hono'
import { getHealthStatus } from '@/services/health.service'

export const healthRoute = new Hono().get('/', (c) => c.json(getHealthStatus()))

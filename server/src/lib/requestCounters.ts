// In-memory hit counters, keyed by an arbitrary scope + id (e.g. an endpoint
// name + Airtable base id). Purely a diagnostic for gauging how often an
// endpoint gets hit per tenant before deciding what to cache -- not a
// persisted metric. On Vercel this lives only as long as the current warm
// serverless instance: it resets on cold start and isn't shared across
// concurrent instances, so treat counts as a rough per-instance signal, not
// an exact global total.
const hitCounts = new Map<string, number>()

export function countHit(scope: string, key: string): number {
  const compositeKey = `${scope}:${key}`
  const count = (hitCounts.get(compositeKey) ?? 0) + 1
  hitCounts.set(compositeKey, count)
  return count
}

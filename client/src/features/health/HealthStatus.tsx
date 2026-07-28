import { Card } from '@/components/Card'
import { useHealth } from '@/hooks/useHealth'

export function HealthStatus() {
  const { data, isPending, isError, error } = useHealth()

  if (isPending) {
    return <Card>Checking API status…</Card>
  }

  if (isError) {
    return <Card role="alert">Error: {error.message}</Card>
  }

  return (
    <Card>
      API status: <strong>{data.status}</strong>
    </Card>
  )
}

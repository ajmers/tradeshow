import type { FeatureFlags } from '@shared'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { useAdminBases } from '@/hooks/useAdminBases'
import { useUpdateUserBase } from '@/hooks/useUpdateUserBase'
import { useUpdateUserFeatureFlags } from '@/hooks/useUpdateUserFeatureFlags'

const FEATURES: { key: keyof FeatureFlags; label: string }[] = [
  { key: 'boothPlanner3d', label: '3D Booth Planner' },
]

export function AdminPage() {
  const users = useAdminUsers()
  const bases = useAdminBases()
  const updateUserBase = useUpdateUserBase()
  const updateFeatureFlags = useUpdateUserFeatureFlags()

  if (users.isPending || bases.isPending) {
    return <p>Loading…</p>
  }

  const firstError = users.error ?? bases.error
  if (firstError) {
    return <p role="alert">Error: {firstError.message}</p>
  }

  const usersData = users.data ?? []
  const basesData = bases.data ?? []

  return (
    <main>
      <h1>Admin</h1>

      <section className="admin-section">
        <h2>Airtable Base</h2>
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Airtable base</th>
            </tr>
          </thead>
          <tbody>
            {usersData.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.email ?? user.id}
                  {user.isAdmin && <span className="admin-badge">Admin</span>}
                </td>
                <td>
                  <select
                    value={user.airtableBaseId ?? ''}
                    disabled={updateUserBase.isPending}
                    onChange={(event) =>
                      updateUserBase.mutate({ userId: user.id, airtableBaseId: event.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select a base…
                    </option>
                    {basesData.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-section">
        <h2>Feature Enablement</h2>
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>User</th>
              {FEATURES.map((feature) => (
                <th key={feature.key}>{feature.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usersData.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.email ?? user.id}
                  {user.isAdmin && <span className="admin-badge">Admin</span>}
                </td>
                {FEATURES.map((feature) => (
                  <td key={feature.key} className="admin-users-table__checkbox-cell">
                    <input
                      type="checkbox"
                      checked={user.featureFlags[feature.key]}
                      disabled={updateFeatureFlags.isPending || !user.airtableBaseId}
                      title={!user.airtableBaseId ? 'Assign an Airtable base first' : undefined}
                      onChange={(event) =>
                        updateFeatureFlags.mutate({
                          userId: user.id,
                          featureFlags: { [feature.key]: event.target.checked },
                        })
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

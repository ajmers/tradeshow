import { useAdminUsers } from '@/hooks/useAdminUsers'
import { useAdminBases } from '@/hooks/useAdminBases'
import { useUpdateUserBase } from '@/hooks/useUpdateUserBase'

export function AdminPage() {
  const users = useAdminUsers()
  const bases = useAdminBases()
  const updateUserBase = useUpdateUserBase()

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
    </main>
  )
}

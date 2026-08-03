defmodule Tradeshow.Admin do
  @default_feature_flags %{"boothPlanner3d" => true, "labelPrinter" => true}

  def list_admin_users do
    with {:ok, users} <- fetch_auth_users(),
         {:ok, profiles} <- fetch_profiles() do
      profiles_by_id = Map.new(profiles, fn p -> {p["id"], p} end)

      admin_users =
        Enum.map(users, fn user ->
          profile = profiles_by_id[user["id"]]

          %{
            id: user["id"],
            email: user["email"],
            airtableBaseId: profile && profile["airtable_base_id"],
            isAdmin: get_in(user, ["app_metadata", "is_admin"]) == true,
            featureFlags:
              Map.merge(@default_feature_flags, (profile && profile["feature_flags"]) || %{})
          }
        end)

      {:ok, admin_users}
    end
  end

  defp fetch_auth_users do
    case Req.get("#{Tradeshow.Supabase.url()}/auth/v1/admin/users",
           headers: admin_headers(),
           params: [per_page: 1000]
         ) do
      {:ok, %{status: 200, body: %{"users" => users}}} -> {:ok, users}
      _ -> {:error, :fetch_users_failed}
    end
  end

  defp fetch_profiles do
    case Req.get("#{Tradeshow.Supabase.url()}/rest/v1/profiles",
           headers: admin_headers(),
           params: [select: "id,airtable_base_id, feature_flags"]
         ) do
      {:ok, %{status: 200, body: profiles}} -> {:ok, profiles}
      _ -> {:error, :fetch_profiles_failed}
    end
  end

  defp admin_headers do
    key = Tradeshow.Supabase.secret_key()
    [{"authorization", "Bearer #{key}"}, {"apikey", key}]
  end
end

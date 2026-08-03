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

  def assign_user_base(user_id, airtable_base_id) do
    with {:ok, bases} <- Tradeshow.Airtable.list_all_bases(),
         true <- Enum.any?(bases, &(&1["id"] == airtable_base_id)) do
      upsert_profile_base(user_id, airtable_base_id)
    else
      false -> {:error, :unknown_base}
      {:error, reason} -> {:error, reason}
    end
  end

  defp upsert_profile_base(user_id, airtable_base_id) do
    case Req.post("#{Tradeshow.Supabase.url()}/rest/v1/profiles",
           headers: admin_headers() ++ [{"prefer", "resolution=merge-duplicates"}],
           json: %{id: user_id, airtable_base_id: airtable_base_id}
         ) do
      {:ok, %{status: status}} when status in 200..299 -> :ok
      _ -> {:error, :update_failed}
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

defmodule TradeshowWeb.Plugs.RequireAuth do
  import Plug.Conn
  require Logger

  def init(opts), do: opts

  defp supabase_url, do: Application.get_env(:tradeshow, :supabase)[:url]
  defp supabase_key, do: Application.get_env(:tradeshow, :supabase)[:publishable_key]

  defp fetch_user(token) do
    case Req.get(supabase_url() <> "/auth/v1/user",
           headers: [{"authorization", "Bearer #{token}"}, {"apikey", supabase_key()}]
         ) do
      {:ok, %{status: 200, body: user}} ->
        {:ok, user}

      {:ok, %{status: status, body: body}} ->
        Logger.warning("Supabase rejected user token: status=#{status} body=#{inspect(body)}")
        {:error, :unauthorized}

      {:error, reason} ->
        Logger.error("Failed to reach Supabase for user lookup: #{inspect(reason)}")
        {:error, :unauthorized}
    end
  end

  defp bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] -> {:ok, token}
      _ -> {:error, :unauthorized}
    end
  end

  # Resolves the user's tenant: {:airtable, base_id} if an admin has assigned
  # one, {:postgres, user_id} otherwise (no profile row, or one with no base
  # assigned yet) — every authenticated user gets one or the other, there's no
  # longer a "blocked" outcome. A genuine failure to reach Supabase at all is
  # the only thing treated as an error here; "no matching profile row" is a
  # normal, expected response for a Postgres-tenant user.
  defp fetch_tenant(token, user_id) do
    headers = [
      {"authorization", "Bearer #{token}"},
      {"apikey", supabase_key()},
      {"accept", "application/vnd.pgrst.object+json"}
    ]

    case Req.get(supabase_url() <> "/rest/v1/profiles",
           headers: headers,
           params: [id: "eq.#{user_id}", select: "airtable_base_id,feature_flags"]
         ) do
      {:ok, %{status: 200, body: %{"airtable_base_id" => base_id} = profile}}
      when is_binary(base_id) ->
        {:ok, {:airtable, base_id}, profile["feature_flags"] || %{}}

      {:ok, %{status: _status}} ->
        {:ok, {:postgres, user_id}, %{}}

      {:error, reason} ->
        Logger.error("Failed to reach Supabase for profile lookup: #{inspect(reason)}")
        {:error, :profile_fetch_failed}
    end
  end

  def call(conn, _opts) do
    with {:ok, token} <- bearer_token(conn),
         {:ok, user} <- fetch_user(token),
         {:ok, tenant, feature_flags} <- fetch_tenant(token, user["id"]) do
      conn
      |> assign(:tenant, tenant)
      |> assign(:user_token, token)
      |> assign(:is_admin, get_in(user, ["app_metadata", "is_admin"]) == true)
      |> assign(
        :feature_flags,
        Map.merge(%{"boothPlanner3d" => true, "labelPrinter" => true}, feature_flags)
      )
    else
      {:error, :unauthorized} ->
        conn |> put_status(401) |> Phoenix.Controller.json(%{error: "Unauthorized"}) |> halt()

      {:error, :profile_fetch_failed} ->
        conn
        |> put_status(502)
        |> Phoenix.Controller.json(%{error: "Failed to look up account"})
        |> halt()
    end
  end
end

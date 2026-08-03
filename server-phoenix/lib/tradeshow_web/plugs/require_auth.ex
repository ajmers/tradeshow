defmodule TradeshowWeb.Plugs.RequireAuth do
  import Plug.Conn

  def init(opts), do: opts

  defp supabase_url, do: Application.get_env(:tradeshow, :supabase)[:url]
  defp supabase_key, do: Application.get_env(:tradeshow, :supabase)[:publishable_key]

  defp fetch_user(token) do
    case Req.get(supabase_url() <> "/auth/v1/user",
           headers: [{"authorization", "Bearer #{token}"}, {"apikey", supabase_key()}]
         ) do
      {:ok, %{status: 200, body: user}} -> {:ok, user}
      _ -> {:error, :unauthorized}
    end
  end

  defp bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] -> {:ok, token}
      _ -> {:error, :unauthorized}
    end
  end

  defp fetch_profile(token, user_id) do
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
        {:ok, profile}

      _ ->
        {:error, :no_base}
    end
  end

  def call(conn, _opts) do
    with {:ok, token} <- bearer_token(conn),
         {:ok, user} <- fetch_user(token),
         {:ok, profile} <- fetch_profile(token, user["id"]) do
      # success path: assign stuff to conn
      conn
      |> assign(:airtable_base_id, profile["airtable_base_id"])
      |> assign(:is_admin, get_in(user, ["app_metadata", "is_admin"]) == true)
      |> assign(
        :feature_flags,
        Map.merge(
          %{"boothPlanner3d" => true, "labelPrinter" => true},
          profile["feature_flags"] || %{}
        )
      )
    else
      {:error, :unauthorized} ->
        conn |> put_status(401) |> Phoenix.Controller.json(%{error: "Unauthorized"}) |> halt()

      {:error, :no_base} ->
        conn
        |> put_status(403)
        |> Phoenix.Controller.json(%{error: "No Airtable base configured for this account"})
        |> halt()
    end
  end
end

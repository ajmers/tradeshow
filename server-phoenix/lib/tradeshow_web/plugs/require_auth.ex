defmodule TradeshowWeb.Plugs.RequireAuth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    with {:ok, token} <- bearer_token(conn),
     {:ok, user} <- fetch_user(token),
     {:ok, profile} <- fetch_profile(token, user["id"]) do
     # success path: assign stuff to conn
    else
      {:error, :unauthorized} -> # halt 401
      {:error, :no_base} -> # halt 403
    end   
  end

  defp supabase_url, do: Application.get_env(:tradeshow, :supabase)[:url]
  defp supabase_key, do: Application.get_env(:tradeshow, :supabase)[:publishable_key]

 bearer_token(conn) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] -> {:ok, token}
      _ -> {:error, :unauthorized}
    end
  end
end

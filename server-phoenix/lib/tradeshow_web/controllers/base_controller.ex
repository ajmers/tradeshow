defmodule TradeshowWeb.BaseController do
  use TradeshowWeb, :controller

  def show(conn, _params) do
    case base_name(conn.assigns.tenant) do
      {:ok, name} ->
        json(conn, %{
          name: name,
          isAdmin: conn.assigns.is_admin,
          featureFlags: conn.assigns.feature_flags
        })

      {:error, _reason} ->
        conn
        |> put_status(502)
        |> json(%{error: "Failed to load base info"})
    end
  end

  defp base_name({:airtable, base_id}), do: Tradeshow.Airtable.get_base_info(base_id)
  defp base_name({:postgres, _user_id}), do: {:ok, "My Workspace"}
end

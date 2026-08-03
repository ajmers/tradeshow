defmodule TradeshowWeb.BaseController do
  use TradeshowWeb, :controller

  def show(conn, _params) do
    case Tradeshow.Airtable.get_base_info(conn.assigns.airtable_base_id) do
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
end

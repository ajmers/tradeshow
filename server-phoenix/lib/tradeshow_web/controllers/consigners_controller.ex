defmodule TradeshowWeb.ConsignersController do
  use TradeshowWeb, :controller

  def index(conn, _params) do
    case Tradeshow.Consigners.list_consigners(conn.assigns.tenant, conn.assigns.user_token) do
      {:ok, records} -> json(conn, records)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Airtable request failed."})
    end
  end
end

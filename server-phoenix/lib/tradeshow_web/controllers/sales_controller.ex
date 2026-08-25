defmodule TradeshowWeb.SalesController do
  use TradeshowWeb, :controller

  def index(conn, _params) do
    case Tradeshow.Sales.list_sales(conn.assigns.airtable_base_id) do
      {:ok, records} ->
        json(conn, records)

      {:error, _reason} ->
        conn
        |> put_status(502)
        |> json(%{error: "Failed to list sales"})
    end
  end

  def create(conn, params) do
    case Tradeshow.Sales.create_sale(conn.assigns.airtable_base_id, params) do
      {:ok, record} -> conn |> put_status(201) |> json(record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to create sale"})
    end
  end
end

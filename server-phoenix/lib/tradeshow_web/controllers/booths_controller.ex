defmodule TradeshowWeb.BoothsController do
  use TradeshowWeb, :controller
  alias Tradeshow.Booths

  def index(conn, _params) do
    case Booths.list_booths(conn.assigns.airtable_base_id) do
      {:ok, records} -> json(conn, records)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to list booths"})
    end
  end

  def create(conn, params) do
    case Booths.create_booth(conn.assigns.airtable_base_id, params) do
      {:ok, record} -> conn |> put_status(201) |> json(conn, record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to create booth"})
    end
  end

  def update(conn, %{"id" => id} = params) do
    fields = Map.delete(params, "id")

    case Booths.update_booth(conn.assigns.airtable_base_id, id, fields) do
      {:ok, record} -> json(conn, record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to update booth"})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Booths.delete_booth(conn.assigns.airtable_base_id, id) do
      :ok -> send_resp(conn, 204, "")
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to delete booth"})
    end
  end
end

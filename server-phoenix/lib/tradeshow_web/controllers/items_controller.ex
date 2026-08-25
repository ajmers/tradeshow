defmodule TradeshowWeb.ItemsController do
  use TradeshowWeb, :controller
  alias Tradeshow.Items

  def index(conn, _params) do
    case Items.list_items(conn.assigns.tenant, conn.assigns.user_token) do
      {:ok, records} -> json(conn, records)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to list items"})
    end
  end

  def create(conn, params) do
    case Items.create_item(conn.assigns.tenant, conn.assigns.user_token, params) do
      {:ok, record} -> conn |> put_status(201) |> json(record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to create item"})
    end
  end

  def update(conn, %{"id" => id} = params) do
    fields = Map.delete(params, "id")

    case Items.update_item(conn.assigns.tenant, conn.assigns.user_token, id, fields) do
      {:ok, record} -> json(conn, record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to update item"})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Items.delete_item(conn.assigns.tenant, conn.assigns.user_token, id) do
      :ok -> send_resp(conn, 204, "")
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to delete item"})
    end
  end

  def upload_photo(conn, %{"id" => id} = params) do
    photo = Map.delete(params, "id")

    case Items.upload_photo(conn.assigns.tenant, conn.assigns.user_token, id, photo) do
      {:ok, record} -> json(conn, record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to upload photo"})
    end
  end
end

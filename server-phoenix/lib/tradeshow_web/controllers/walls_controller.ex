defmodule TradeshowWeb.WallsController do
  use TradeshowWeb, :controller

  def index(conn, _params) do
    case Tradeshow.Walls.list_walls(conn.assigns.tenant, conn.assigns.user_token) do
      {:ok, records} -> json(conn, records)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to list walls"})
    end
  end

  def create(conn, params) do
    case Tradeshow.Walls.create_wall(conn.assigns.tenant, conn.assigns.user_token, params) do
      {:ok, record} -> json(conn, record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to create wall"})
    end
  end

  def update(conn, %{"id" => id} = params) do
    fields = Map.delete(params, "id")

    case Tradeshow.Walls.update_wall(conn.assigns.tenant, conn.assigns.user_token, id, fields) do
      {:ok, record} -> json(conn, record)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to update wall"})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Tradeshow.Walls.delete_wall(conn.assigns.tenant, conn.assigns.user_token, id) do
      :ok -> send_resp(conn, 204, "")
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to delete wall"})
    end
  end
end

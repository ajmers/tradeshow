defmodule TradeshowWeb.FloorPlacementsController do
  use TradeshowWeb, :controller
  alias Tradeshow.FloorPlacements

  def index(conn, _params) do
    case FloorPlacements.list_floor_placements(conn.assigns.tenant, conn.assigns.user_token) do
      {:ok, records} ->
        json(conn, records)

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to list floor placements"})
    end
  end

  def create(conn, params) do
    case FloorPlacements.create_floor_placement(
           conn.assigns.tenant,
           conn.assigns.user_token,
           params
         ) do
      {:ok, record} ->
        conn |> put_status(201) |> json(record)

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to create floor placement"})
    end
  end

  def update(conn, %{"id" => id} = params) do
    fields = Map.delete(params, "id")

    case FloorPlacements.update_floor_placement(
           conn.assigns.tenant,
           conn.assigns.user_token,
           id,
           fields
         ) do
      {:ok, record} ->
        json(conn, record)

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to update floor placement"})
    end
  end

  def delete(conn, %{"id" => id}) do
    case FloorPlacements.delete_floor_placement(conn.assigns.tenant, conn.assigns.user_token, id) do
      :ok ->
        send_resp(conn, 204, "")

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to delete floor placement"})
    end
  end
end

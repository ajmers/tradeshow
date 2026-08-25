defmodule TradeshowWeb.WallAssignmentsController do
  use TradeshowWeb, :controller
  alias Tradeshow.WallAssignments

  def index(conn, _params) do
    case WallAssignments.list_wall_assignments(conn.assigns.tenant, conn.assigns.user_token) do
      {:ok, records} ->
        json(conn, records)

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to list wall assignments"})
    end
  end

  def create(conn, params) do
    case WallAssignments.create_wall_assignment(
           conn.assigns.tenant,
           conn.assigns.user_token,
           params
         ) do
      {:ok, record} ->
        conn |> put_status(201) |> json(record)

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to create wall assignment"})
    end
  end

  def update(conn, %{"id" => id} = params) do
    fields = Map.delete(params, "id")

    case WallAssignments.update_wall_assignment(
           conn.assigns.tenant,
           conn.assigns.user_token,
           id,
           fields
         ) do
      {:ok, record} ->
        json(conn, record)

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to update wall assignment"})
    end
  end

  def delete(conn, %{"id" => id}) do
    case WallAssignments.delete_wall_assignment(conn.assigns.tenant, conn.assigns.user_token, id) do
      :ok ->
        send_resp(conn, 204, "")

      {:error, _reason} ->
        conn |> put_status(502) |> json(%{error: "Failed to delete wall assignment"})
    end
  end
end

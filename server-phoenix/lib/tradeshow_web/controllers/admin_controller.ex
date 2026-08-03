defmodule TradeshowWeb.AdminController do
  use TradeshowWeb, :controller

  def users(conn, _params) do
    case Tradeshow.Admin.list_admin_users() do
      {:ok, users} -> json(conn, users)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to list users"})
    end
  end

  def bases(conn, _params) do
    case Tradeshow.Airtable.list_all_bases() do
      {:ok, bases} -> json(conn, bases)
      {:error, _reason} -> conn |> put_status(502) |> json(%{error: "Failed to list bases"})
    end
  end
end

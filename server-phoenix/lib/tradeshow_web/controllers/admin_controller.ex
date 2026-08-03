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

  def assign_user_base(conn, %{"id" => user_id, "airtableBaseId" => airtable_base_id}) do
    case Tradeshow.Admin.assign_user_base(user_id, airtable_base_id) do
      :ok ->
        json(conn, %{ok: true})

      {:error, :unknown_base} ->
        conn |> put_status(400) |> json(%{error: "Unknown Airtable base id"})

      {:error, _} ->
        conn |> put_status(502) |> json(%{error: "Failed to update user"})
    end
  end

  def update_profile_feature_flags(conn, %{"id" => user_id, "featureFlags" => feature_flags}) do
    case Tradeshow.Admin.set_user_feature_flags(user_id, feature_flags) do
      {:ok, profile} ->
        json(conn, profile)

      {:error, :no_base_assigned} ->
        conn
        |> put_status(400)
        |> json(%{
          error: "Assign an Airtable base to this user before enabling features for them."
        })

      {:error, _} ->
        conn
        |> put_status(400)
        |> json(%{error: "Failed to update feature flags"})
    end
  end
end

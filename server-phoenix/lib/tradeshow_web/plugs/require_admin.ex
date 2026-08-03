defmodule TradeshowWeb.Plugs.RequireAdmin do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    if conn.assigns[:is_admin] do
      conn
    else
      conn
      |> put_status(403)
      |> Phoenix.Controller.json(%{error: "Forbidden"})
      |> halt()
    end
  end
end

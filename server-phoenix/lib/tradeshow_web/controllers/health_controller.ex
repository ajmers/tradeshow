defmodule TradeshowWeb.HealthController do
  use TradeshowWeb, :controller

  def check(conn, _params) do
    json(conn, %{status: "ok"})
  end
end

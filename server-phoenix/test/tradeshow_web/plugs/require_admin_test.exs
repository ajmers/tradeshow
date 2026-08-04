defmodule TradeshowWeb.Plugs.RequireAdminTest do
  use ExUnit.Case, async: true
  import Plug.Test
  import Plug.Conn

  test "passes through when is_admin is true" do
    conn =
      conn(:get, "/")
      |> assign(:is_admin, true)
      |> TradeshowWeb.Plugs.RequireAdmin.call([])

    refute conn.halted
  end

  test "halts with 403 when is_admin is false" do
    conn =
      conn(:get, "/")
      |> assign(:is_admin, false)
      |> TradeshowWeb.Plugs.RequireAdmin.call([])

    assert conn.halted
    assert conn.status == 403
  end

  test "halts with 403 when is_admin is not set" do
    conn =
      conn(:get, "/")
      |> TradeshowWeb.Plugs.RequireAdmin.call([])

    assert conn.halted
    assert conn.status == 403
  end
end

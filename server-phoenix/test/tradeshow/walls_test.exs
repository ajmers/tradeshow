defmodule Tradeshow.WallsTest do
  use ExUnit.Case, async: true

  test "delete_wall deletes assignments on the wall, then the wall iteself" do
    base_id = "appTEST123"
    wall_id = "recWALL123"

    Req.Test.stub(Tradeshow.Airtable, fn conn ->
      case {conn.method, conn.path_info} do
        {"GET", ["v0", ^base_id, "Wall%20Assignments"]} ->
          Req.Test.json(conn, %{
            "records" => [
              %{"id" => "recAssign1", "fields" => %{"Wall" => [wall_id]}},
              %{"id" => "recAssign2", "fields" => %{"Wall" => ["recOtherWall"]}}
            ]
          })

        {"DELETE", ["v0", ^base_id, "Wall%20Assignments", "recAssign1"]} ->
          Req.Test.json(conn, %{"id" => "recAssign1", "deleted" => true})

        {"DELETE", ["v0", ^base_id, "Walls", ^wall_id]} ->
          Req.Test.json(conn, %{"id" => wall_id, "deleted" => true})
      end
    end)

    assert Tradeshow.Walls.delete_wall(base_id, wall_id) == :ok
  end
end

defmodule Tradeshow.Booths do
  def list_booths(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Booths")
  end

  def create_booth(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Booths", fields)
  end

  def update_booth(base_id, id, fields) do
    Tradeshow.Airtable.update_record(base_id, "Booths", id, fields)
  end

  def delete_booth(base_id, id) do
    with {:ok, walls} <- Tradeshow.Walls.list_walls(base_id),
         {:ok, assignments} <- Tradeshow.WallAssignments.list_wall_assignments(base_id),
         {:ok, floor_placements} <- Tradeshow.FloorPlacements.list_floor_placements(base_id) do
      wall_ids_in_booth =
        walls
        |> Enum.filter(fn wall -> id in (get_in(wall, ["fields", "Booths"]) || []) end)
        |> Enum.map(& &1["id"])

      assignments_in_booth =
        Enum.filter(assignments, fn a -> id in (get_in(a, ["fields", "Booth"]) || []) end)

      floor_placements_in_booth =
        Enum.filter(floor_placements, fn p -> id in (get_in(p, ["fields", "Booth"]) || []) end)

      with :ok <-
             delete_each(
               assignments_in_booth,
               &Tradeshow.WallAssignments.delete_wall_assignment(base_id, &1["id"])
             ),
           :ok <-
             delete_each(
               floor_placements_in_booth,
               &Tradeshow.FloorPlacements.delete_floor_placement(base_id, &1["id"])
             ),
           :ok <- delete_each(wall_ids_in_booth, &Tradeshow.Walls.delete_wall(base_id, &1)) do
        Tradeshow.Airtable.delete_record(base_id, "Booths", id)
      end
    end
  end

  defp delete_each(items, delete_fn) do
    Enum.reduce_while(items, :ok, fn item, _acc ->
      case delete_fn.(item) do
        :ok -> {:cont, :ok}
        {:error, _} = error -> {:halt, error}
      end
    end)
  end
end

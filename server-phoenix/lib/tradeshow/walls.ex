defmodule Tradeshow.Walls do
  def list_walls(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Walls")
  end

  def create_wall(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Walls", fields)
  end

  def update_wall(base_id, id, fields) do
    Tradeshow.Airtable.update_record(base_id, "Walls", id, fields)
  end

  def delete_wall(base_id, id) do
    with {:ok, assignments} <- Tradeshow.WallAssignments.list_wall_assignments(base_id),
         :ok <- delete_assignments_on_wall(base_id, id, assignments) do
      Tradeshow.Airtable.delete_record(base_id, "Walls", id)
    end
  end

  defp delete_assignments_on_wall(base_id, wall_id, assignments) do
    assignments_on_wall =
      Enum.filter(assignments, fn assignment ->
        wall_ids = get_in(assignment, ["fields", "Wall"]) || []
        wall_id in wall_ids
      end)

    Enum.reduce_while(assignments_on_wall, :ok, fn assignment, _acc ->
      case Tradeshow.WallAssignments.delete_wall_assignment(base_id, assignment["id"]) do
        :ok -> {:cont, :ok}
        {:error, error} -> {:halt, error}
      end
    end)
  end
end

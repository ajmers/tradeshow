defmodule Tradeshow.WallAssignments do
  def list_wall_assignments(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Wall Assignments")
  end

  def delete_wall_assignment(base_id, id) do
    Tradeshow.Airtable.delete_record(base_id, "Wall Assignments", id)
  end
end

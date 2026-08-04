defmodule Tradeshow.FloorPlacements do
  def list_floor_placements(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Floor Placements")
  end

  def create_floor_placement(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Floor Placements", fields)
  end

  def update_floor_placement(base_id, id, fields) do
    Tradeshow.Airtable.update_record(base_id, "Floor Placements", id, fields)
  end

  def delete_floor_placement(base_id, id) do
    Tradeshow.Airtable.delete_record(base_id, "Floor Placements", id)
  end
end

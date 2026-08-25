defmodule Tradeshow.FloorPlacements do
  alias Tradeshow.FloorPlacements.{Airtable, Postgres}

  def list_floor_placements({:airtable, base_id}, _token),
    do: Airtable.list_floor_placements(base_id)

  def list_floor_placements({:postgres, user_id}, token),
    do: Postgres.list_floor_placements(user_id, token)

  def create_floor_placement({:airtable, base_id}, _token, fields),
    do: Airtable.create_floor_placement(base_id, fields)

  def create_floor_placement({:postgres, user_id}, token, fields),
    do: Postgres.create_floor_placement(user_id, token, fields)

  def update_floor_placement({:airtable, base_id}, _token, id, fields),
    do: Airtable.update_floor_placement(base_id, id, fields)

  def update_floor_placement({:postgres, user_id}, token, id, fields),
    do: Postgres.update_floor_placement(user_id, token, id, fields)

  def delete_floor_placement({:airtable, base_id}, _token, id),
    do: Airtable.delete_floor_placement(base_id, id)

  def delete_floor_placement({:postgres, user_id}, token, id),
    do: Postgres.delete_floor_placement(user_id, token, id)
end

defmodule Tradeshow.FloorPlacements.Airtable do
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

defmodule Tradeshow.FloorPlacements.Postgres do
  alias Tradeshow.Postgres.Envelope

  def list_floor_placements(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "floor_placements", user_id: "eq.#{user_id}") do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  def create_floor_placement(user_id, token, fields) do
    attrs = fields |> from_input() |> Map.put("user_id", user_id)

    with {:ok, row} <- Tradeshow.Postgres.create_record(token, "floor_placements", attrs) do
      {:ok, to_record(row)}
    end
  end

  def update_floor_placement(_user_id, token, id, fields) do
    attrs = from_input(fields)

    with {:ok, row} <- Tradeshow.Postgres.update_record(token, "floor_placements", id, attrs) do
      {:ok, to_record(row)}
    end
  end

  def delete_floor_placement(_user_id, token, id) do
    Tradeshow.Postgres.delete_record(token, "floor_placements", id)
  end

  defp from_input(fields) do
    %{}
    |> Envelope.put_field(fields, "Placement", "placement")
    |> Envelope.put_field(fields, "X Position", "x_position")
    |> Envelope.put_field(fields, "Y Position", "y_position")
    |> Envelope.put_field(fields, "Rotation Angle", "rotation_angle")
    |> maybe_put_ref(fields, "Item", "item_id")
    |> maybe_put_ref(fields, "Booth", "booth_id")
  end

  defp maybe_put_ref(attrs, fields, key, column) do
    if Map.has_key?(fields, key) do
      Map.put(attrs, column, Envelope.unwrap(fields[key]))
    else
      attrs
    end
  end

  defp to_record(row) do
    Envelope.to_record(row, %{
      "Placement" => row["placement"],
      "Item" => Envelope.wrap(row["item_id"]),
      "Booth" => Envelope.wrap(row["booth_id"]),
      "X Position" => row["x_position"],
      "Y Position" => row["y_position"],
      "Rotation Angle" => row["rotation_angle"]
    })
  end
end

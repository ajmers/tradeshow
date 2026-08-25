defmodule Tradeshow.WallAssignments do
  alias Tradeshow.WallAssignments.{Airtable, Postgres}

  def list_wall_assignments({:airtable, base_id}, _token),
    do: Airtable.list_wall_assignments(base_id)

  def list_wall_assignments({:postgres, user_id}, token),
    do: Postgres.list_wall_assignments(user_id, token)

  def create_wall_assignment({:airtable, base_id}, _token, fields),
    do: Airtable.create_wall_assignment(base_id, fields)

  def create_wall_assignment({:postgres, user_id}, token, fields),
    do: Postgres.create_wall_assignment(user_id, token, fields)

  def update_wall_assignment({:airtable, base_id}, _token, id, fields),
    do: Airtable.update_wall_assignment(base_id, id, fields)

  def update_wall_assignment({:postgres, user_id}, token, id, fields),
    do: Postgres.update_wall_assignment(user_id, token, id, fields)

  def delete_wall_assignment({:airtable, base_id}, _token, id),
    do: Airtable.delete_wall_assignment(base_id, id)

  def delete_wall_assignment({:postgres, user_id}, token, id),
    do: Postgres.delete_wall_assignment(user_id, token, id)
end

defmodule Tradeshow.WallAssignments.Airtable do
  def list_wall_assignments(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Wall Assignments")
  end

  def create_wall_assignment(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Wall Assignments", fields)
  end

  def update_wall_assignment(base_id, id, fields) do
    Tradeshow.Airtable.update_record(base_id, "Wall Assignments", id, fields)
  end

  def delete_wall_assignment(base_id, id) do
    Tradeshow.Airtable.delete_record(base_id, "Wall Assignments", id)
  end
end

defmodule Tradeshow.WallAssignments.Postgres do
  alias Tradeshow.Postgres.Envelope

  def list_wall_assignments(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "wall_assignments", user_id: "eq.#{user_id}") do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  def create_wall_assignment(user_id, token, fields) do
    attrs = fields |> from_input() |> Map.put("user_id", user_id)

    with {:ok, row} <- Tradeshow.Postgres.create_record(token, "wall_assignments", attrs) do
      {:ok, to_record(row)}
    end
  end

  def update_wall_assignment(_user_id, token, id, fields) do
    attrs = from_input(fields)

    with {:ok, row} <- Tradeshow.Postgres.update_record(token, "wall_assignments", id, attrs) do
      {:ok, to_record(row)}
    end
  end

  def delete_wall_assignment(_user_id, token, id) do
    Tradeshow.Postgres.delete_record(token, "wall_assignments", id)
  end

  defp from_input(fields) do
    %{}
    |> Envelope.put_field(fields, "Assignment", "assignment")
    |> Envelope.put_field(fields, "X Position", "x_position")
    |> Envelope.put_field(fields, "Y Position", "y_position")
    |> Envelope.put_field(fields, "Rotation Angle", "rotation_angle")
    |> Envelope.put_field(fields, "Label X Position", "label_x_position")
    |> Envelope.put_field(fields, "Label Y Position", "label_y_position")
    |> Envelope.put_field(fields, "Label Hidden", "label_hidden")
    |> Envelope.put_field(fields, "Label Shown", "label_shown")
    |> Envelope.put_field(fields, "Notes", "notes")
    |> Envelope.put_field(fields, "Order", "order")
    |> maybe_put_ref(fields, "Wall", "wall_id")
    |> maybe_put_ref(fields, "Painting", "item_id")
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
      "Assignment" => row["assignment"],
      "Wall" => Envelope.wrap(row["wall_id"]),
      "Painting" => Envelope.wrap(row["item_id"]),
      "Booth" => Envelope.wrap(row["booth_id"]),
      "X Position" => row["x_position"],
      "Y Position" => row["y_position"],
      "Rotation Angle" => row["rotation_angle"],
      "Label X Position" => row["label_x_position"],
      "Label Y Position" => row["label_y_position"],
      "Label Hidden" => row["label_hidden"],
      "Label Shown" => row["label_shown"],
      "Notes" => row["notes"],
      "Order" => row["order"]
    })
  end
end

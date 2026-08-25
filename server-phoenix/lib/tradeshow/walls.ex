defmodule Tradeshow.Walls do
  alias Tradeshow.Walls.{Airtable, Postgres}

  def list_walls({:airtable, base_id}, _token), do: Airtable.list_walls(base_id)
  def list_walls({:postgres, user_id}, token), do: Postgres.list_walls(user_id, token)

  def create_wall({:airtable, base_id}, _token, fields), do: Airtable.create_wall(base_id, fields)

  def create_wall({:postgres, user_id}, token, fields),
    do: Postgres.create_wall(user_id, token, fields)

  def update_wall({:airtable, base_id}, _token, id, fields),
    do: Airtable.update_wall(base_id, id, fields)

  def update_wall({:postgres, user_id}, token, id, fields),
    do: Postgres.update_wall(user_id, token, id, fields)

  def delete_wall({:airtable, base_id}, _token, id), do: Airtable.delete_wall(base_id, id)
  def delete_wall({:postgres, user_id}, token, id), do: Postgres.delete_wall(user_id, token, id)
end

defmodule Tradeshow.Walls.Airtable do
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
    with {:ok, assignments} <- Tradeshow.WallAssignments.Airtable.list_wall_assignments(base_id),
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
      case Tradeshow.WallAssignments.Airtable.delete_wall_assignment(base_id, assignment["id"]) do
        :ok -> {:cont, :ok}
        {:error, error} -> {:halt, error}
      end
    end)
  end
end

defmodule Tradeshow.Walls.Postgres do
  alias Tradeshow.Postgres.Envelope

  def list_walls(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "walls", user_id: "eq.#{user_id}") do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  def create_wall(user_id, token, fields) do
    attrs = fields |> from_input() |> Map.put("user_id", user_id)

    with {:ok, row} <- Tradeshow.Postgres.create_record(token, "walls", attrs) do
      {:ok, to_record(row)}
    end
  end

  def update_wall(_user_id, token, id, fields) do
    attrs = from_input(fields)

    with {:ok, row} <- Tradeshow.Postgres.update_record(token, "walls", id, attrs) do
      {:ok, to_record(row)}
    end
  end

  def delete_wall(_user_id, token, id) do
    Tradeshow.Postgres.delete_record(token, "walls", id)
  end

  defp from_input(fields) do
    %{}
    |> Envelope.put_field(fields, "Wall Name", "name")
    |> Envelope.put_field(fields, "Height", "height")
    |> Envelope.put_field(fields, "Width", "width")
    |> Envelope.put_field(fields, "Unit of Measure", "unit_of_measure")
    |> Envelope.put_field(fields, "Wall Color", "wall_color")
    |> Envelope.put_field(fields, "Description", "description")
    |> Envelope.put_field(fields, "Location", "location")
    |> Envelope.put_field(fields, "Booth Surface", "booth_surface")
    |> Envelope.put_field(fields, "Show Labels", "show_labels")
    |> maybe_put_booth_id(fields)
  end

  defp maybe_put_booth_id(attrs, fields) do
    if Map.has_key?(fields, "Booths") do
      Map.put(attrs, "booth_id", Envelope.unwrap(fields["Booths"]))
    else
      attrs
    end
  end

  defp to_record(row) do
    Envelope.to_record(row, %{
      "Wall Name" => row["name"],
      "Height" => row["height"],
      "Width" => row["width"],
      "Unit of Measure" => row["unit_of_measure"],
      "Wall Color" => row["wall_color"],
      "Description" => row["description"],
      "Location" => row["location"],
      "Booths" => Envelope.wrap(row["booth_id"]),
      "Booth Surface" => row["booth_surface"],
      "Show Labels" => row["show_labels"]
    })
  end
end

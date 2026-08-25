defmodule Tradeshow.Booths do
  alias Tradeshow.Booths.{Airtable, Postgres}

  def list_booths({:airtable, base_id}, _token), do: Airtable.list_booths(base_id)
  def list_booths({:postgres, user_id}, token), do: Postgres.list_booths(user_id, token)

  def create_booth({:airtable, base_id}, _token, fields),
    do: Airtable.create_booth(base_id, fields)

  def create_booth({:postgres, user_id}, token, fields),
    do: Postgres.create_booth(user_id, token, fields)

  def update_booth({:airtable, base_id}, _token, id, fields),
    do: Airtable.update_booth(base_id, id, fields)

  def update_booth({:postgres, user_id}, token, id, fields),
    do: Postgres.update_booth(user_id, token, id, fields)

  def delete_booth({:airtable, base_id}, _token, id), do: Airtable.delete_booth(base_id, id)
  def delete_booth({:postgres, user_id}, token, id), do: Postgres.delete_booth(user_id, token, id)
end

defmodule Tradeshow.Booths.Airtable do
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
    with {:ok, walls} <- Tradeshow.Walls.Airtable.list_walls(base_id),
         {:ok, assignments} <- Tradeshow.WallAssignments.Airtable.list_wall_assignments(base_id),
         {:ok, floor_placements} <-
           Tradeshow.FloorPlacements.Airtable.list_floor_placements(base_id) do
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
               &Tradeshow.WallAssignments.Airtable.delete_wall_assignment(base_id, &1["id"])
             ),
           :ok <-
             delete_each(
               floor_placements_in_booth,
               &Tradeshow.FloorPlacements.Airtable.delete_floor_placement(base_id, &1["id"])
             ),
           :ok <-
             delete_each(wall_ids_in_booth, &Tradeshow.Walls.Airtable.delete_wall(base_id, &1)) do
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

defmodule Tradeshow.Booths.Postgres do
  alias Tradeshow.Postgres.Envelope

  # Embeds each booth's reverse relations directly in list/create/update
  # responses, matching what Airtable's own "Walls"/"Wall Assignments"/"Sales"
  # linked-record fields already give the client on a Booth.
  @select "*,walls(id),wall_assignments(id),sales(id)"

  def list_booths(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "booths",
             user_id: "eq.#{user_id}",
             select: @select
           ) do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  def create_booth(user_id, token, fields) do
    attrs = fields |> from_input() |> Map.put("user_id", user_id)

    with {:ok, row} <- Tradeshow.Postgres.create_record(token, "booths", attrs, select: @select) do
      {:ok, to_record(row)}
    end
  end

  def update_booth(_user_id, token, id, fields) do
    attrs = from_input(fields)

    with {:ok, row} <-
           Tradeshow.Postgres.update_record(token, "booths", id, attrs, select: @select) do
      {:ok, to_record(row)}
    end
  end

  def delete_booth(_user_id, token, id) do
    Tradeshow.Postgres.delete_record(token, "booths", id)
  end

  defp from_input(fields) do
    %{}
    |> Envelope.put_field(fields, "Booth Name", "name")
    |> Envelope.put_field(fields, "Event Start Date", "event_start_date")
    |> Envelope.put_field(fields, "Event End Date", "event_end_date")
    |> Envelope.put_field(fields, "Booth Type", "booth_type")
    |> Envelope.put_field(fields, "Event Location", "event_location")
    |> Envelope.put_field(fields, "Organizer", "organizer")
    |> Envelope.put_field(fields, "Notes", "notes")
    |> Envelope.put_field(fields, "Booth Width", "width")
    |> Envelope.put_field(fields, "Booth Depth", "depth")
    |> Envelope.put_field(fields, "Booth Height", "height")
  end

  defp to_record(row) do
    Envelope.to_record(row, %{
      "Booth Name" => row["name"],
      "Event Start Date" => row["event_start_date"],
      "Event End Date" => row["event_end_date"],
      "Booth Type" => row["booth_type"],
      "Event Location" => row["event_location"],
      "Organizer" => row["organizer"],
      "Notes" => row["notes"],
      "Walls" => Enum.map(row["walls"] || [], & &1["id"]),
      "Wall Assignments" => Enum.map(row["wall_assignments"] || [], & &1["id"]),
      "Sales" => Enum.map(row["sales"] || [], & &1["id"]),
      "Booth Width" => row["width"],
      "Booth Depth" => row["depth"],
      "Booth Height" => row["height"]
    })
  end
end

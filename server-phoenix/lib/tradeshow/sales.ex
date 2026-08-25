defmodule Tradeshow.Sales do
  alias Tradeshow.Sales.{Airtable, Postgres}

  def list_sales({:airtable, base_id}, _token), do: Airtable.list_sales(base_id)
  def list_sales({:postgres, user_id}, token), do: Postgres.list_sales(user_id, token)

  def create_sale({:airtable, base_id}, _token, fields), do: Airtable.create_sale(base_id, fields)

  def create_sale({:postgres, user_id}, token, fields),
    do: Postgres.create_sale(user_id, token, fields)
end

defmodule Tradeshow.Sales.Airtable do
  def list_sales(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Sales")
  end

  def create_sale(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Sales", fields)
  end
end

defmodule Tradeshow.Sales.Postgres do
  alias Tradeshow.Postgres.Envelope

  # "Items (Sale History Link)" is many-to-many (a sale can cover more than
  # one item), so it's embedded via the sale_items join table rather than a
  # single column — see supabase/0004_postgres_tenant_schema.sql.
  @select "*,sale_items(item_id)"

  def list_sales(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "sales",
             user_id: "eq.#{user_id}",
             select: @select
           ) do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  def create_sale(user_id, token, fields) do
    attrs = fields |> from_input() |> Map.put("user_id", user_id)
    item_ids = fields["Items (Sale History Link)"] || []

    with {:ok, row} <- Tradeshow.Postgres.create_record(token, "sales", attrs),
         :ok <- create_sale_items(token, row["id"], item_ids) do
      {:ok, to_record(row, item_ids)}
    end
  end

  defp create_sale_items(_token, _sale_id, []), do: :ok

  defp create_sale_items(token, sale_id, item_ids) do
    join_rows = Enum.map(item_ids, &%{"sale_id" => sale_id, "item_id" => &1})

    case Tradeshow.Postgres.create_record(token, "sale_items", join_rows) do
      {:ok, _} -> :ok
      {:error, _} = error -> error
    end
  end

  defp from_input(fields) do
    %{}
    |> Envelope.put_field(fields, "Sale Price", "sale_price")
    |> Envelope.put_field(fields, "Date Sold", "date_sold")
    |> Envelope.put_field(fields, "Sale Notes", "sale_notes")
    |> maybe_put_venue(fields)
  end

  defp maybe_put_venue(attrs, fields) do
    if Map.has_key?(fields, "Venue") do
      Map.put(attrs, "booth_id", Envelope.unwrap(fields["Venue"]))
    else
      attrs
    end
  end

  defp to_record(row, item_ids \\ nil) do
    item_ids =
      item_ids ||
        case row["sale_items"] do
          list when is_list(list) -> Enum.map(list, & &1["item_id"])
          _ -> []
        end

    Envelope.to_record(row, %{
      "Sale Price" => row["sale_price"],
      "Date Sold" => row["date_sold"],
      "Venue" => Envelope.wrap(row["booth_id"]),
      "Sale Notes" => row["sale_notes"],
      "Items (Sale History Link)" => item_ids
    })
  end
end

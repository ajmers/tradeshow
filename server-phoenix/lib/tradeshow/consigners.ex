defmodule Tradeshow.Consigners do
  alias Tradeshow.Consigners.{Airtable, Postgres}

  def list_consigners({:airtable, base_id}, _token), do: Airtable.list_consigners(base_id)
  def list_consigners({:postgres, user_id}, token), do: Postgres.list_consigners(user_id, token)
end

defmodule Tradeshow.Consigners.Airtable do
  def list_consigners(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Consigners")
  end
end

defmodule Tradeshow.Consigners.Postgres do
  alias Tradeshow.Postgres.Envelope

  def list_consigners(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "consigners", user_id: "eq.#{user_id}") do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  defp to_record(row) do
    Envelope.to_record(row, %{
      "Name" => row["name"],
      "Consignment rate" => row["consignment_rate"]
    })
  end
end

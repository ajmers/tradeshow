defmodule Tradeshow.Airtable do
  defp airtable_pat, do: Application.get_env(:tradeshow, :airtable)[:pat]

  defp fetch_page(base_id, table, offset, acc) do
    params = if(offset, do: [offset: offset], else: [])

    case Req.get("https://api.airtable.com/v0/#{base_id}/#{URI.encode(table)}",
           headers: [{"authorization", "Bearer #{airtable_pat()}"}],
           params: params
         ) do
      {:ok, %{status: 200, body: %{"records" => records} = body}} ->
        all_records = acc ++ records

        case body["offset"] do
          nil ->
            {:ok, all_records}

          next_offset ->
            fetch_page(base_id, table, next_offset, all_records)
        end

      _ ->
        {:error, :airtable_request_failed}
    end
  end

  def list_all_records(base_id, table) do
    fetch_page(base_id, table, nil, [])
  end

  defp fetch_base(offset, acc) do
    params = if(offset, do: [offset: offset], else: [])

    case Req.get("https://api.airtable.com/v0/meta/bases",
           headers: [{"authorization", "Bearer #{airtable_pat()}"}],
           params: params
         ) do
      {:ok, %{status: 200, body: %{"bases" => bases} = body}} ->
        all_bases = acc ++ bases

        case body["offset"] do
          nil ->
            {:ok, all_bases}

          next_offset ->
            fetch_base(next_offset, all_bases)
        end

      _ ->
        {:error, :airtable_request_failed}
    end
  end

  def list_all_bases() do
    fetch_base(nil, [])
  end
end

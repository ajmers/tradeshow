defmodule Tradeshow.Airtable do
  require Logger

  defp req_opts, do: Application.get_env(:tradeshow, :airtable_req_opts, [])

  defp airtable_pat, do: Application.get_env(:tradeshow, :airtable)[:pat]

  def create_record(base_id, table, fields) do
    case Req.post(
           "https://api.airtable.com/v0/#{base_id}/#{URI.encode(table)}",
           Keyword.merge(
             [
               headers: [{"authorization", "Bearer #{airtable_pat()}"}],
               json: %{fields: fields}
             ],
             req_opts()
           )
         ) do
      {:ok, %{status: status, body: record}} when status in 200..299 ->
        {:ok, record}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Airtable create_record failed: status=#{status} body=#{inspect(body)}")
        {:error, :airtable_request_failed}

      {:error, reason} ->
        Logger.error("Airtable create_record request error: #{inspect(reason)}")
        {:error, :airtable_request_failed}
    end
  end

  defp fetch_page(base_id, table, offset, acc) do
    params = if(offset, do: [offset: offset], else: [])

    case Req.get(
           "https://api.airtable.com/v0/#{base_id}/#{URI.encode(table)}",
           Keyword.merge(
             [
               headers: [{"authorization", "Bearer #{airtable_pat()}"}],
               params: params
             ],
             req_opts()
           )
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

    case Req.get(
           "https://api.airtable.com/v0/meta/bases",
           Keyword.merge(
             [
               headers: [{"authorization", "Bearer #{airtable_pat()}"}],
               params: params
             ],
             req_opts()
           )
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

  def get_base_info(base_id) do
    with {:ok, bases} <- list_all_bases() do
      base = Enum.find(bases, &(&1["id"] == base_id))
      {:ok, base && base["name"]}
    end
  end

  def get_record(base_id, table, id) do
    case Req.get(
           "https://api.airtable.com/v0/#{base_id}/#{URI.encode(table)}/#{id}",
           Keyword.merge(
             [headers: [{"authorization", "Bearer #{airtable_pat()}"}]],
             req_opts()
           )
         ) do
      {:ok, %{status: 200, body: record}} ->
        {:ok, record}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Airtable get_record failed: status=#{status} body=#{inspect(body)}")
        {:error, :airtable_request_failed}

      {:error, reason} ->
        Logger.error("Airtable get_record request error: #{inspect(reason)}")
        {:error, :airtable_request_failed}
    end
  end

  # Unlike every other call here, Airtable's response for this endpoint keys
  # `fields` by field ID rather than field name, so callers should re-fetch
  # the record via get_record/3 afterward rather than trusting this response.
  def upload_attachment(base_id, record_id, field_name, attachment) do
    case Req.post(
           "https://content.airtable.com/v0/#{base_id}/#{record_id}/#{URI.encode(field_name)}/uploadAttachment",
           Keyword.merge(
             [
               headers: [{"authorization", "Bearer #{airtable_pat()}"}],
               json: attachment
             ],
             req_opts()
           )
         ) do
      {:ok, %{status: status}} when status in 200..299 ->
        :ok

      {:ok, %{status: status, body: body}} ->
        Logger.error("Airtable upload_attachment failed: status=#{status} body=#{inspect(body)}")
        {:error, :airtable_request_failed}

      {:error, reason} ->
        Logger.error("Airtable upload_attachment request error: #{inspect(reason)}")
        {:error, :airtable_request_failed}
    end
  end

  def update_record(base_id, table, id, fields) do
    case Req.patch(
           "https://api.airtable.com/v0/#{base_id}/#{URI.encode(table)}/#{id}",
           Keyword.merge(
             [
               headers: [{"authorization", "Bearer #{airtable_pat()}"}],
               json: %{fields: fields}
             ],
             req_opts()
           )
         ) do
      {:ok, %{status: status, body: record}} when status in 200..299 ->
        {:ok, record}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Airtable update_record failed: status=#{status} body=#{inspect(body)}")
        {:error, :airtable_request_failed}

      {:error, reason} ->
        Logger.error("Airtable update_record request error: #{inspect(reason)}")
        {:error, :airtable_request_failed}
    end
  end

  def delete_record(base_id, table, id) do
    case Req.delete(
           "https://api.airtable.com/v0/#{base_id}/#{URI.encode(table)}/#{id}",
           Keyword.merge(
             [
               headers: [{"authorization", "Bearer #{airtable_pat()}"}]
             ],
             req_opts()
           )
         ) do
      {:ok, %{status: status}} when status in 200..299 ->
        :ok

      {:ok, %{status: status, body: body}} ->
        Logger.error("Airtable delete_record failed: status=#{status} body=#{inspect(body)}")
        {:error, :airtable_request_failed}

      {:error, reason} ->
        Logger.error("Airtable delete_record request error: #{inspect(reason)}")
        {:error, :airtable_request_failed}
    end
  end
end

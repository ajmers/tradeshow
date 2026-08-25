defmodule Tradeshow.Items do
  alias Tradeshow.Items.{Airtable, Postgres}

  def list_items({:airtable, base_id}, _token), do: Airtable.list_items(base_id)
  def list_items({:postgres, user_id}, token), do: Postgres.list_items(user_id, token)

  def create_item({:airtable, base_id}, _token, fields), do: Airtable.create_item(base_id, fields)

  def create_item({:postgres, user_id}, token, fields),
    do: Postgres.create_item(user_id, token, fields)

  def update_item({:airtable, base_id}, _token, id, fields),
    do: Airtable.update_item(base_id, id, fields)

  def update_item({:postgres, user_id}, token, id, fields),
    do: Postgres.update_item(user_id, token, id, fields)

  def delete_item({:airtable, base_id}, _token, id), do: Airtable.delete_item(base_id, id)
  def delete_item({:postgres, user_id}, token, id), do: Postgres.delete_item(user_id, token, id)

  def upload_photo({:airtable, base_id}, _token, id, photo),
    do: Airtable.upload_photo(base_id, id, photo)

  def upload_photo({:postgres, user_id}, token, id, photo),
    do: Postgres.upload_photo(user_id, token, id, photo)
end

defmodule Tradeshow.Items.Airtable do
  def list_items(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Items")
  end

  def create_item(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Items", fields)
  end

  def update_item(base_id, id, fields) do
    Tradeshow.Airtable.update_record(base_id, "Items", id, fields)
  end

  def delete_item(base_id, id) do
    Tradeshow.Airtable.delete_record(base_id, "Items", id)
  end

  def upload_photo(base_id, id, %{
        "field" => field,
        "filename" => filename,
        "contentType" => content_type,
        "file" => file
      }) do
    with :ok <-
           Tradeshow.Airtable.upload_attachment(base_id, id, field, %{
             "filename" => filename,
             "contentType" => content_type,
             "file" => file
           }) do
      Tradeshow.Airtable.get_record(base_id, "Items", id)
    end
  end
end

defmodule Tradeshow.Items.Postgres do
  require Logger
  alias Tradeshow.Postgres.Envelope

  # How long an uploaded photo's signed URL stays valid for. The client caches
  # item records (react-query) without proactively re-signing image URLs, so
  # this needs to comfortably outlast a normal session — a week is a pragmatic
  # middle ground between that and keeping the bucket private.
  @sign_expires_in 60 * 60 * 24 * 7

  def list_items(user_id, token) do
    with {:ok, rows} <-
           Tradeshow.Postgres.list_records(token, "items", user_id: "eq.#{user_id}") do
      {:ok, Enum.map(rows, &to_record/1)}
    end
  end

  def create_item(user_id, token, fields) do
    attrs = fields |> from_input() |> Map.put("user_id", user_id)

    with {:ok, row} <- Tradeshow.Postgres.create_record(token, "items", attrs) do
      {:ok, to_record(row)}
    end
  end

  def update_item(_user_id, token, id, fields) do
    attrs = from_input(fields)

    with {:ok, row} <- Tradeshow.Postgres.update_record(token, "items", id, attrs) do
      {:ok, to_record(row)}
    end
  end

  def delete_item(_user_id, token, id) do
    Tradeshow.Postgres.delete_record(token, "items", id)
  end

  def upload_photo(user_id, token, id, %{
        "field" => field,
        "filename" => filename,
        "contentType" => content_type,
        "file" => base64_file
      }) do
    column = photo_column(field)
    path = "#{user_id}/#{id}/#{random_uuid()}-#{filename}"

    with {:ok, binary} <- decode_file(base64_file),
         {:ok, _} <- upload_object(token, path, binary, content_type),
         {:ok, url} <- sign_url(token, path),
         {:ok, [current | _]} <-
           Tradeshow.Postgres.list_records(token, "items", id: "eq.#{id}") do
      attachment = %{
        "id" => random_uuid(),
        "url" => url,
        "filename" => filename,
        "size" => byte_size(binary),
        "type" => content_type
      }

      updated_photos = (current[column] || []) ++ [attachment]

      with {:ok, row} <-
             Tradeshow.Postgres.update_record(token, "items", id, %{column => updated_photos}) do
        {:ok, to_record(row)}
      end
    else
      {:ok, []} -> {:error, :not_found}
      error -> error
    end
  end

  defp photo_column("Images"), do: "images"
  defp photo_column("cropped image"), do: "cropped_image"

  defp decode_file(base64_file) do
    case Base.decode64(base64_file) do
      {:ok, binary} -> {:ok, binary}
      :error -> {:error, :invalid_file}
    end
  end

  defp upload_object(token, path, binary, content_type) do
    case Req.post(
           "#{Tradeshow.Supabase.url()}/storage/v1/object/item-photos/#{path}",
           headers: [
             {"authorization", "Bearer #{token}"},
             {"apikey", Tradeshow.Supabase.publishable_key()},
             {"content-type", content_type}
           ],
           body: binary
         ) do
      {:ok, %{status: status} = resp} when status in 200..299 ->
        {:ok, resp}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Supabase Storage upload failed: status=#{status} body=#{inspect(body)}")
        {:error, :storage_upload_failed}

      {:error, reason} ->
        Logger.error("Supabase Storage upload request error: #{inspect(reason)}")
        {:error, :storage_upload_failed}
    end
  end

  defp sign_url(token, path) do
    case Req.post(
           "#{Tradeshow.Supabase.url()}/storage/v1/object/sign/item-photos/#{path}",
           headers: [
             {"authorization", "Bearer #{token}"},
             {"apikey", Tradeshow.Supabase.publishable_key()}
           ],
           json: %{"expiresIn" => @sign_expires_in}
         ) do
      {:ok, %{status: 200, body: %{"signedURL" => signed_url}}} ->
        {:ok, "#{Tradeshow.Supabase.url()}/storage/v1#{signed_url}"}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Supabase Storage sign failed: status=#{status} body=#{inspect(body)}")
        {:error, :storage_sign_failed}

      {:error, reason} ->
        Logger.error("Supabase Storage sign request error: #{inspect(reason)}")
        {:error, :storage_sign_failed}
    end
  end

  defp random_uuid do
    <<u0::48, _::4, u1::12, _::2, u2::62>> = :crypto.strong_rand_bytes(16)

    <<u0::48, 4::4, u1::12, 2::2, u2::62>>
    |> Base.encode16(case: :lower)
    |> String.replace(~r/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "\\1-\\2-\\3-\\4-\\5")
  end

  defp from_input(fields) do
    %{}
    |> Envelope.put_field(fields, "Title", "title")
    |> Envelope.put_field(fields, "Artist", "artist")
    |> Envelope.put_field(fields, "Description", "description")
    |> Envelope.put_field(fields, "Height", "height")
    |> Envelope.put_field(fields, "Width", "width")
    |> Envelope.put_field(fields, "Depth", "depth")
    |> Envelope.put_field(fields, "Unit of Measure", "unit_of_measure")
    |> Envelope.put_field(fields, "Framing Details", "framing_details")
    |> Envelope.put_field(fields, "Date Acquired", "date_acquired")
    |> Envelope.put_field(fields, "Location", "location")
    |> Envelope.put_field(fields, "Condition", "condition")
    |> Envelope.put_field(fields, "Tags", "tags")
    |> Envelope.put_field(fields, "Consigner", "consigner_id")
    |> Envelope.put_field(fields, "List Price", "list_price")
    |> Envelope.put_field(fields, "Discount", "discount")
    |> Envelope.put_field(fields, "Label", "label")
    |> Envelope.put_field(fields, "Label Title", "label_title")
    |> Envelope.put_field(fields, "Label Size", "label_size")
    |> Envelope.put_field(fields, "Is Prop", "is_prop")
  end

  defp to_record(row) do
    Envelope.to_record(row, %{
      "Title" => row["title"],
      "Artist" => row["artist"],
      "Description" => row["description"],
      "Images" => row["images"] || [],
      "cropped image" => row["cropped_image"] || [],
      "Height" => row["height"],
      "Width" => row["width"],
      "Depth" => row["depth"],
      "Unit of Measure" => row["unit_of_measure"],
      "Framing Details" => row["framing_details"],
      "Date Acquired" => row["date_acquired"],
      "Location" => row["location"],
      "Condition" => row["condition"],
      "Tags" => row["tags"] || [],
      "Consigner" => row["consigner_id"],
      "List Price" => row["list_price"],
      "Discount" => row["discount"],
      "Label" => row["label"],
      "Label Title" => row["label_title"],
      "Label Size" => row["label_size"],
      "Is Prop" => row["is_prop"]
    })
  end
end

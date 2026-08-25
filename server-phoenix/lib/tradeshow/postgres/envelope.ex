defmodule Tradeshow.Postgres.Envelope do
  @moduledoc """
  Shared helpers for translating Postgres rows into the same
  `%{"id" => ..., "createdTime" => ..., "fields" => %{...}}` envelope the
  client already expects from Airtable-backed responses (see
  shared/src/schemas/*.ts), and for translating writes back the other way —
  so the client can't tell which tenant type it's talking to.
  """

  # Airtable represents a to-one relation on the child as a 1-element array
  # of the parent's record id (e.g. a Wall's "Booths": [boothId]).
  def wrap(nil), do: nil
  def wrap(id), do: [id]

  def unwrap(nil), do: nil
  def unwrap([]), do: nil
  def unwrap([id | _]), do: id

  # Airtable never returns a key for an empty field — it omits it entirely,
  # rather than sending it as null. The shared zod schemas (itemFieldsSchema
  # etc.) are written around that: `.optional()` means "key may be absent,"
  # not "key may be null". Postgres columns are `null` when unset, so every
  # *.Postgres `to_record` needs to drop those before wrapping the envelope,
  # or a freshly-created record with blank optional fields fails to parse on
  # the client.
  def to_record(row, fields) do
    %{
      "id" => row["id"],
      "createdTime" => row["created_at"],
      "fields" => Enum.reject(fields, fn {_key, value} -> is_nil(value) end) |> Map.new()
    }
  end

  # Only puts `column` into `attrs` when `key` is actually present in the
  # incoming fields map — including when it's explicitly `null` (some fields,
  # e.g. Booth Width, are nullable so the UI can clear them; omitted keys must
  # leave the existing column untouched on a partial update).
  def put_field(attrs, fields, key, column) do
    if Map.has_key?(fields, key) do
      Map.put(attrs, column, Map.get(fields, key))
    else
      attrs
    end
  end
end

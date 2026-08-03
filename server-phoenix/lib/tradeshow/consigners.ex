defmodule Tradeshow.Consigners do
  def list_consigners(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Consigners")
  end
end
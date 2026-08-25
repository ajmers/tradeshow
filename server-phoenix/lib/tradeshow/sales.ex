defmodule Tradeshow.Sales do
  def list_sales(base_id) do
    Tradeshow.Airtable.list_all_records(base_id, "Sales")
  end

  def create_sale(base_id, fields) do
    Tradeshow.Airtable.create_record(base_id, "Sales", fields)
  end
end

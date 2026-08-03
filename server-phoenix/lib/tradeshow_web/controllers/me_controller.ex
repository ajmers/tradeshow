defmodule TradeshowWeb.MeController do
    use TradeshowWeb, :controller

    def show(conn, _params) do 
        json(conn, %{
            airtable_base_id: conn.assigns.airtable_base_id,
            is_admin: conn.assigns.is_admin,
            feature_flags: conn.assigns.feature_flags
        })
    end
end

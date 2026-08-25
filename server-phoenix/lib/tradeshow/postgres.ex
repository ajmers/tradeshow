defmodule Tradeshow.Postgres do
  @moduledoc """
  Generic PostgREST client for the Postgres-backed tenant tables (see
  supabase/0004_postgres_tenant_schema.sql). Mirrors `Tradeshow.Airtable`'s
  shape, but always forwards the calling user's own JWT rather than a service
  key, so Postgres row-level security — not application code — is what keeps
  one user's data isolated from another's.
  """

  require Logger

  defp req_opts, do: Application.get_env(:tradeshow, :postgres_req_opts, [])

  defp supabase_url, do: Tradeshow.Supabase.url()

  defp headers(token, extra) do
    [
      {"authorization", "Bearer #{token}"},
      {"apikey", Tradeshow.Supabase.publishable_key()}
    ] ++ extra
  end

  def list_records(token, table, params \\ []) do
    case Req.get(
           "#{supabase_url()}/rest/v1/#{table}",
           Keyword.merge([headers: headers(token, []), params: params], req_opts())
         ) do
      {:ok, %{status: 200, body: records}} ->
        {:ok, records}

      {:ok, %{status: status, body: body}} ->
        Logger.error(
          "Postgres list_records failed: table=#{table} status=#{status} body=#{inspect(body)}"
        )

        {:error, :postgres_request_failed}

      {:error, reason} ->
        Logger.error("Postgres list_records request error: table=#{table} #{inspect(reason)}")
        {:error, :postgres_request_failed}
    end
  end

  # `params` may include an extra `select:` (e.g. to embed related rows in the
  # response the same way a follow-up GET would) — PostgREST honors `select`
  # on writes too when `Prefer: return=representation` is set.
  def create_record(token, table, attrs, params \\ []) do
    case Req.post(
           "#{supabase_url()}/rest/v1/#{table}",
           Keyword.merge(
             [
               headers: headers(token, [{"prefer", "return=representation"}]),
               params: params,
               json: attrs
             ],
             req_opts()
           )
         ) do
      {:ok, %{status: status, body: [record | _]}} when status in 200..299 ->
        {:ok, record}

      {:ok, %{status: status, body: body}} ->
        Logger.error(
          "Postgres create_record failed: table=#{table} status=#{status} body=#{inspect(body)}"
        )

        {:error, :postgres_request_failed}

      {:error, reason} ->
        Logger.error("Postgres create_record request error: table=#{table} #{inspect(reason)}")
        {:error, :postgres_request_failed}
    end
  end

  def update_record(token, table, id, attrs, params \\ []) do
    case Req.patch(
           "#{supabase_url()}/rest/v1/#{table}",
           Keyword.merge(
             [
               headers: headers(token, [{"prefer", "return=representation"}]),
               params: [{:id, "eq.#{id}"} | params],
               json: attrs
             ],
             req_opts()
           )
         ) do
      {:ok, %{status: status, body: [record | _]}} when status in 200..299 ->
        {:ok, record}

      {:ok, %{status: status, body: body}} ->
        Logger.error(
          "Postgres update_record failed: table=#{table} status=#{status} body=#{inspect(body)}"
        )

        {:error, :postgres_request_failed}

      {:error, reason} ->
        Logger.error("Postgres update_record request error: table=#{table} #{inspect(reason)}")
        {:error, :postgres_request_failed}
    end
  end

  def delete_record(token, table, id) do
    case Req.delete(
           "#{supabase_url()}/rest/v1/#{table}",
           Keyword.merge([headers: headers(token, []), params: [id: "eq.#{id}"]], req_opts())
         ) do
      {:ok, %{status: status}} when status in 200..299 ->
        :ok

      {:ok, %{status: status, body: body}} ->
        Logger.error(
          "Postgres delete_record failed: table=#{table} status=#{status} body=#{inspect(body)}"
        )

        {:error, :postgres_request_failed}

      {:error, reason} ->
        Logger.error("Postgres delete_record request error: table=#{table} #{inspect(reason)}")
        {:error, :postgres_request_failed}
    end
  end
end

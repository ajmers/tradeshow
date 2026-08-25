defmodule Tradeshow.Signup do
  @moduledoc """
  Gates self-serve signup behind a shared beta access code, since account
  creation itself (`supabase.auth.signUp`) is a public Supabase endpoint the
  client can't fully lock down on its own — this is enforced here instead,
  server-side, before we ever create the Supabase Auth user.
  """

  require Logger

  # No code configured means signup stays disabled — a safe default rather
  # than silently falling open in an environment that forgot to set one.
  def valid_code?(code) do
    expected = Application.get_env(:tradeshow, :beta_access_code)

    is_binary(expected) and expected != "" and is_binary(code) and
      Plug.Crypto.secure_compare(code, expected)
  end

  def create_user(email, password) do
    case Req.post("#{Tradeshow.Supabase.url()}/auth/v1/admin/users",
           headers: admin_headers(),
           json: %{email: email, password: password, email_confirm: true}
         ) do
      {:ok, %{status: status, body: user}} when status in 200..299 ->
        {:ok, user}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Signup failed: status=#{status} body=#{inspect(body)}")
        {:error, error_message(body)}

      {:error, reason} ->
        Logger.error("Signup request error: #{inspect(reason)}")
        {:error, "Failed to create account"}
    end
  end

  defp error_message(%{"msg" => msg}) when is_binary(msg), do: msg
  defp error_message(%{"message" => msg}) when is_binary(msg), do: msg
  defp error_message(_), do: "Failed to create account"

  defp admin_headers do
    key = Tradeshow.Supabase.secret_key()
    [{"authorization", "Bearer #{key}"}, {"apikey", key}]
  end
end

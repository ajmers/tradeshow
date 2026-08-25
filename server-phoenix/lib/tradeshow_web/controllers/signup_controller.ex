defmodule TradeshowWeb.SignupController do
  use TradeshowWeb, :controller

  def create(conn, %{"email" => email, "password" => password, "code" => code}) do
    if Tradeshow.Signup.valid_code?(code) do
      case Tradeshow.Signup.create_user(email, password) do
        {:ok, _user} -> conn |> put_status(201) |> json(%{ok: true})
        {:error, message} -> conn |> put_status(400) |> json(%{error: message})
      end
    else
      conn |> put_status(403) |> json(%{error: "Invalid beta access code"})
    end
  end
end

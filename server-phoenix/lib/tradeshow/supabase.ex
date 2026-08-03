defmodule Tradeshow.Supabase do
  def url, do: Application.get_env(:tradeshow, :supabase)[:url]
  def publishable_key, do: Application.get_env(:tradeshow, :supabase)[:publishable_key]
  def secret_key, do: Application.get_env(:tradeshow, :supabase)[:secret_key]
end

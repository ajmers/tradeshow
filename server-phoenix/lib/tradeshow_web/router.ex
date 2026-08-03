defmodule TradeshowWeb.Router do
  use TradeshowWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug TradeshowWeb.Plugs.RequireAuth
  end

  pipeline :is_admin do
    plug TradeshowWeb.Plugs.RequireAdmin
  end

  scope "/api", TradeshowWeb do
    pipe_through :api
    get "/health", HealthController, :check
  end

  scope "/api", TradeshowWeb do
    pipe_through [:api, :authenticated]
    get "/consigners", ConsignersController, :index
    get "/base", BaseController, :show
  end

  scope "/api", TradeshowWeb do
    pipe_through [:api, :authenticated, :is_admin]
    get "/admin/users", AdminController, :users
    get "/admin/bases", AdminController, :bases
    patch "/admin/users/:id", AdminController, :assign_user_base
    patch "/admin/users/:id/feature-flags", AdminController, :update_profile_feature_flags
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:tradeshow, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: TradeshowWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end

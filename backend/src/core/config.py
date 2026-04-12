from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ZStar API"
    debug: bool = False

    database_url: str = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_audience: str = ""
    clerk_webhook_secret: str = ""

    anthropic_api_key: str = ""

    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": "../.env", "extra": "ignore"}


settings = Settings()

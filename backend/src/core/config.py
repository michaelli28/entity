from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Look in backend/.env first, then repo-root .env (for monorepo dev).
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "ZStar API"
    debug: bool = False

    database_url: str = ""

    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_audience: str = ""
    clerk_webhook_secret: str = ""
    clerk_secret_key: str = ""

    anthropic_api_key: str = ""

    frontend_url: str = "http://localhost:3000"

    posthog_api_key: str = ""
    sentry_dsn: str = ""
    environment: str = "development"

    resend_api_key: str = ""

    COVERAGE_COMPLETION_THRESHOLD: int = 75
    COVERAGE_MIN_TURNS: int = 3


settings = Settings()


REQUIRED_PROD_SECRETS = (
    "database_url",
    "clerk_webhook_secret",
    "clerk_jwks_url",
    "clerk_secret_key",
    "anthropic_api_key",
)


def validate_required_secrets() -> None:
    missing = [name for name in REQUIRED_PROD_SECRETS if not getattr(settings, name)]
    if missing:
        names = ", ".join(name.upper() for name in missing)
        raise RuntimeError(f"Missing required environment variables: {names}")

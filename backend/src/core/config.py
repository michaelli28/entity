from enum import Enum

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class RagMode(str, Enum):
    """RAG feature gate. Single-knob rollout replaces boolean pair."""

    OFF = "off"
    MENTOR_ONLY = "mentor_only"
    FULL = "full"


class Settings(BaseSettings):
    # Look in backend/.env first, then repo-root .env (for monorepo dev).
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Entity API"
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

    rag_mode: RagMode = RagMode.OFF
    openai_api_key: str = ""

    @model_validator(mode="after")
    def _rag_requires_openai_key(self) -> "Settings":
        if self.rag_mode is not RagMode.OFF and not self.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY is required when rag_mode is not 'off'"
            )
        return self


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

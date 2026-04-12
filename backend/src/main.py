from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.api.auth import router as auth_router
from src.api.chat import router as chat_router
from src.api.cofounder import router as cofounder_router
from src.api.cold_reads import router as cold_reads_router
from src.api.commitments import router as commitments_router
from src.api.export import router as export_router
from src.api.founders import router as founders_router
from src.api.intro_requests import router as intro_requests_router
from src.api.sessions import router as sessions_router
from src.core.config import settings, validate_required_secrets
from src.core.cors import setup_cors
from src.core.logging import configure_logging
from src.core.rate_limit import limiter
from src.core.request_id import RequestIDMiddleware
from src.core.sentry import init_sentry
from src.db.connection import close_pool, init_pool
from src.jobs.scheduler import start_scheduler, stop_scheduler

init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    validate_required_secrets()
    await init_pool()
    start_scheduler()
    yield
    stop_scheduler()
    await close_pool()


app = FastAPI(
    title="ZStar API",
    version="0.1.0",
    description="AI-powered founder profiling and deal flow",
    lifespan=lifespan,
)

configure_logging(settings.environment)
setup_cors(app)
app.add_middleware(RequestIDMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(cofounder_router)
app.include_router(cold_reads_router)
app.include_router(commitments_router)
app.include_router(export_router)
app.include_router(founders_router)
app.include_router(intro_requests_router)
app.include_router(sessions_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

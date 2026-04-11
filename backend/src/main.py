from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.api.auth import router as auth_router
from src.core.cors import setup_cors
from src.core.rate_limit import limiter
from src.db.connection import close_pool, init_pool


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_pool()
    yield
    await close_pool()


app = FastAPI(
    title="ZStar API",
    version="0.1.0",
    description="AI-powered founder profiling and deal flow",
    lifespan=lifespan,
)

setup_cors(app)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(auth_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

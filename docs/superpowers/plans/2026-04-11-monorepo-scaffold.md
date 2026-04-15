# Entity Monorepo Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Entity monorepo with a working dev environment — Next.js frontend, FastAPI backend, Supabase database, and unified Makefile commands.

**Architecture:** Flat monorepo with pnpm workspaces for TypeScript (apps/web + packages/ui) and uv for Python (backend/). A root Makefile unifies commands. Supabase manages PostgreSQL + pgvector locally. No feature code — structure and tooling only.

**Tech Stack:** Next.js 15+, React 19, Tailwind 4, shadcn/ui, FastAPI, Pydantic v2, asyncpg, Supabase, Clerk, pnpm, uv

**Design Spec:** `docs/superpowers/specs/2026-04-11-monorepo-scaffold-design.md`

---

### Task 1: Initialize Git and Root Config

**Files:**

- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.env.example`
- Create: `.npmrc`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/possible/Documents/Entity
git init
```

- [ ] **Step 2: Create root .gitignore**

```gitignore
# Dependencies
node_modules/
.pnpm-store/
__pycache__/
*.pyc
.venv/
*.egg-info/

# Build
.next/
out/
dist/
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Supabase
supabase/.temp/
supabase/.branches/

# Testing
coverage/
.coverage
htmlcov/
.pytest_cache/
playwright-report/
test-results/

# Misc
*.log
```

- [ ] **Step 3: Create root package.json**

```json
{
  "name": "entity",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter @entity/web dev",
    "build:web": "pnpm --filter @entity/web build",
    "lint:web": "pnpm --filter @entity/web lint",
    "test:web": "pnpm --filter @entity/web test"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 4: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 5: Create .npmrc**

```
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 6: Create .env.example**

```bash
# =============================================================================
# Clerk (frontend — safe to expose in browser)
# =============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# =============================================================================
# Clerk (server-only — NEVER prefix with NEXT_PUBLIC_)
# =============================================================================
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
CLERK_JWKS_URL=
CLERK_ISSUER=

# =============================================================================
# Supabase (frontend — safe to expose, RLS protects data)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# =============================================================================
# Supabase (server-only — bypasses RLS, NEVER expose to frontend)
# =============================================================================
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# =============================================================================
# Anthropic (server-only)
# =============================================================================
ANTHROPIC_API_KEY=

# =============================================================================
# App
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 7: Install root dependencies and commit**

```bash
pnpm install
git add .
git commit -m "chore: initialize monorepo root with pnpm workspaces"
```

---

### Task 2: Scaffold Next.js Frontend

**Files:**

- Create: `apps/web/` (entire Next.js project)
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/possible/Documents/Entity
pnpm create next-app apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --turbopack \
  --skip-install
```

- [ ] **Step 2: Update apps/web/package.json**

Set the package name and add workspace dependency:

```json
{
  "name": "@entity/web",
  "dependencies": {
    "@entity/ui": "workspace:*",
    "@clerk/nextjs": "^6.12.0",
    "@tanstack/react-query": "^5.75.0",
    "react-hook-form": "^7.56.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "vitest": "^3.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@playwright/test": "^1.52.0"
  }
}
```

Note: Merge these into the existing package.json generated by create-next-app. Keep existing `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `eslint` deps.

- [ ] **Step 3: Upgrade to Tailwind 4**

Remove the old tailwind config and update PostCSS:

```bash
cd apps/web
rm -f tailwind.config.ts postcss.config.mjs
```

Create `apps/web/postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

Add Tailwind 4 deps (merge into package.json devDependencies):

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0"
  }
}
```

- [ ] **Step 4: Configure Tailwind 4 CSS**

Replace `apps/web/src/app/globals.css` with:

```css
@import "tailwindcss";

@source "../../../../packages/ui/src/**/*.{ts,tsx}";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --color-background: oklch(0.13 0.01 260);
  --color-foreground: oklch(0.95 0.01 260);
  --color-muted: oklch(0.2 0.01 260);
  --color-muted-foreground: oklch(0.6 0.01 260);
  --color-border: oklch(0.25 0.01 260);

  --color-primary: oklch(0.65 0.2 280);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-accent: oklch(0.7 0.15 200);
  --color-accent-foreground: oklch(0.13 0.01 260);

  --color-destructive: oklch(0.6 0.2 25);
  --color-success: oklch(0.65 0.2 150);

  --color-card: oklch(0.16 0.01 260);
  --color-card-foreground: oklch(0.95 0.01 260);

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

- [ ] **Step 5: Update next.config.ts**

Replace `apps/web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@entity/ui"],
};

export default nextConfig;
```

- [ ] **Step 6: Update tsconfig.json path aliases**

Ensure `apps/web/tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Note: Merge into existing tsconfig — keep the Next.js defaults, just ensure `strict: true` and `paths` are set.

- [ ] **Step 7: Create app route group directories**

```bash
mkdir -p apps/web/src/app/\(auth\)/sign-in/[[...sign-in]]
mkdir -p apps/web/src/app/\(auth\)/sign-up/[[...sign-up]]
mkdir -p apps/web/src/app/\(dashboard\)/chat
mkdir -p apps/web/src/app/\(dashboard\)/profile
mkdir -p apps/web/src/app/\(dashboard\)/scores
mkdir -p apps/web/src/app/\(dashboard\)/sessions
mkdir -p apps/web/src/app/\(marketing\)
mkdir -p apps/web/src/app/api/webhooks/clerk
mkdir -p apps/web/src/components
mkdir -p apps/web/src/hooks
mkdir -p apps/web/src/lib
```

- [ ] **Step 8: Create placeholder layout and pages**

`apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}
```

`apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}
```

`apps/web/src/app/(dashboard)/layout.tsx`:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  );
}
```

`apps/web/src/app/(dashboard)/chat/page.tsx`:

```tsx
export default function ChatPage() {
  return <div>Chat — AI Mentor</div>;
}
```

`apps/web/src/app/(marketing)/page.tsx`:

```tsx
export default function HomePage() {
  return <div>Entity — AI-Powered Founder Profiling</div>;
}
```

- [ ] **Step 9: Wire up Clerk provider**

`apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entity",
  description: "AI-powered founder profiling and deal flow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className="bg-background text-foreground antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

`apps/web/src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 10: Create vitest config**

`apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
```

`apps/web/src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add test script to `apps/web/package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 11: Write a smoke test**

`apps/web/src/__tests__/smoke.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";

describe("smoke test", () => {
  it("runs vitest successfully", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 12: Run test to verify it passes**

```bash
cd /Users/possible/Documents/Entity
pnpm install
pnpm --filter @entity/web test
```

Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add apps/web/
git commit -m "feat: scaffold Next.js 15 frontend with Clerk, Tailwind 4, Vitest"
```

---

### Task 3: Create UI Package

**Files:**

- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/utils.ts`

- [ ] **Step 1: Create packages/ui directory structure**

```bash
mkdir -p packages/ui/src/components
mkdir -p packages/ui/src/aceternity
mkdir -p packages/ui/src/magic
mkdir -p packages/ui/src/charts
```

- [ ] **Step 2: Create packages/ui/package.json**

```json
{
  "name": "@entity/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./*": {
      "types": "./src/*.tsx",
      "default": "./src/*.tsx"
    }
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "lucide-react": "^0.475.0"
  }
}
```

- [ ] **Step 3: Create packages/ui/tsconfig.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create cn() utility**

`packages/ui/src/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create barrel export**

`packages/ui/src/index.ts`:

```ts
export { cn } from "./utils";
```

- [ ] **Step 6: Initialize shadcn in apps/web, then move components**

```bash
cd /Users/possible/Documents/Entity/apps/web
npx shadcn@latest init -y --style new-york --base-color neutral
```

After init, move the generated `components/ui/` and `lib/utils.ts` to `packages/ui/`:

```bash
# shadcn generates into apps/web/src/components/ui/ and apps/web/src/lib/utils.ts
# Move components to packages/ui
cp -r /Users/possible/Documents/Entity/apps/web/src/components/ui/* /Users/possible/Documents/Entity/packages/ui/src/components/
# Remove the copied files from apps/web (we'll import from @entity/ui)
rm -rf /Users/possible/Documents/Entity/apps/web/src/components/ui
rm -f /Users/possible/Documents/Entity/apps/web/src/lib/utils.ts
```

Update `packages/ui/src/components/` files to import `cn` from `../utils` instead of `@/lib/utils`.

- [ ] **Step 7: Add a shadcn component to verify the pipeline**

```bash
cd /Users/possible/Documents/Entity/apps/web
npx shadcn@latest add button
```

Move the generated button to packages/ui:

```bash
mv /Users/possible/Documents/Entity/apps/web/src/components/ui/button.tsx /Users/possible/Documents/Entity/packages/ui/src/components/button.tsx
```

Update `packages/ui/src/components/button.tsx` import of `cn` to:

```ts
import { cn } from "../utils";
```

Export from `packages/ui/src/index.ts`:

```ts
export { cn } from "./utils";
export { Button, buttonVariants } from "./components/button";
```

- [ ] **Step 8: Verify apps/web can import from @entity/ui**

Update `apps/web/src/app/(marketing)/page.tsx`:

```tsx
import { Button } from "@entity/ui";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button>Entity — AI-Powered Founder Profiling</Button>
    </div>
  );
}
```

- [ ] **Step 9: Install and verify**

```bash
cd /Users/possible/Documents/Entity
pnpm install
pnpm --filter @entity/web dev
```

Open `http://localhost:3000` — should see a styled button. Kill the dev server.

- [ ] **Step 10: Commit**

```bash
git add packages/ui/ apps/web/
git commit -m "feat: create @entity/ui package with shadcn/ui, Button component"
```

---

### Task 4: Scaffold FastAPI Backend

**Files:**

- Create: `backend/.python-version`
- Create: `backend/pyproject.toml`
- Create: `backend/src/__init__.py`
- Create: `backend/src/main.py`
- Create: `backend/src/core/__init__.py`
- Create: `backend/src/core/config.py`
- Create: `backend/src/core/cors.py`
- Create: `backend/src/api/__init__.py`
- Create: `backend/src/db/__init__.py`
- Create: `backend/src/llm/__init__.py`
- Create: `backend/src/models/__init__.py`
- Create: `backend/src/scoring/__init__.py`
- Create: `backend/src/services/__init__.py`
- Create: `backend/src/core/dependencies.py`
- Create: `backend/src/core/rate_limit.py`
- Create: `backend/src/api/auth.py`
- Create: `backend/src/db/connection.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create backend directory structure**

```bash
mkdir -p backend/src/api
mkdir -p backend/src/core
mkdir -p backend/src/db/repositories
mkdir -p backend/src/llm
mkdir -p backend/src/models
mkdir -p backend/src/scoring
mkdir -p backend/src/services
mkdir -p backend/tests
```

- [ ] **Step 2: Create .python-version**

`backend/.python-version`:

```
3.12
```

- [ ] **Step 3: Create pyproject.toml**

`backend/pyproject.toml`:

```toml
[project]
name = "entity-api"
version = "0.1.0"
description = "Entity API — AI-powered founder profiling"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.135.0",
    "uvicorn[standard]>=0.44.0",
    "pydantic>=2.12.0",
    "pydantic-settings>=2.8.0",
    "asyncpg>=0.31.0",
    "pgvector>=0.3.6",
    "anthropic>=0.52.0",
    "instructor>=1.8.0",
    "pyjwt[crypto]>=2.10.0",
    "httpx>=0.28.0",
    "svix>=1.62.0",
    "slowapi>=0.1.9",
]

[dependency-groups]
dev = [
    "pytest>=9.0.0",
    "pytest-asyncio>=1.3.0",
    "httpx>=0.28.0",
    "ruff>=0.11.0",
    "pyright>=1.1.400",
]

[project.scripts]
dev = "uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
start = "uvicorn src.main:app --host 0.0.0.0 --port 8000"

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.ruff.format]
quote-style = "double"

[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
venvPath = "."
venv = ".venv"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 4: Create all **init**.py files**

```bash
touch backend/src/__init__.py
touch backend/src/api/__init__.py
touch backend/src/core/__init__.py
touch backend/src/db/__init__.py
touch backend/src/db/repositories/__init__.py
touch backend/src/llm/__init__.py
touch backend/src/models/__init__.py
touch backend/src/scoring/__init__.py
touch backend/src/services/__init__.py
touch backend/tests/__init__.py
```

- [ ] **Step 5: Create config module**

`backend/src/core/config.py`:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Entity API"
    debug: bool = False

    database_url: str = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

    clerk_jwks_url: str = ""
    clerk_issuer: str = ""
    clerk_webhook_secret: str = ""

    anthropic_api_key: str = ""

    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": "../.env", "extra": "ignore"}


settings = Settings()
```

- [ ] **Step 6: Create CORS module**

`backend/src/core/cors.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings


def setup_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
```

- [ ] **Step 7: Create main.py**

`backend/src/main.py`:

```python
from fastapi import FastAPI

from src.core.cors import setup_cors

app = FastAPI(
    title="Entity API",
    version="0.1.0",
    description="AI-powered founder profiling and deal flow",
)

setup_cors(app)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 8: Create test conftest and health test**

`backend/tests/conftest.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
```

`backend/tests/test_health.py`:

```python
from httpx import AsyncClient


async def test_health_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 9: Install deps and run test**

```bash
cd /Users/possible/Documents/Entity/backend
uv sync
uv run pytest tests/test_health.py -v
```

Expected: PASS — `test_health_returns_ok PASSED`

- [ ] **Step 10: Create JWT verification dependency**

`backend/src/core/dependencies.py`:

```python
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.config import settings

bearer_scheme = HTTPBearer()

_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.clerk_jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
    return _jwks_cache


async def verify_clerk_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwks["keys"][0])
        payload: dict[str, Any] = jwt.decode(
            token,
            key=signing_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
        )
        return payload
    except (jwt.InvalidTokenError, httpx.HTTPError, KeyError, IndexError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e
```

- [ ] **Step 11: Create rate limiting middleware**

`backend/src/core/rate_limit.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

Wire into `backend/src/main.py` — add these lines:

```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from src.core.rate_limit import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

- [ ] **Step 12: Create Clerk webhook handler stub**

`backend/src/api/auth.py`:

```python
import json
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from svix.webhooks import Webhook, WebhookVerificationError

from src.core.config import settings

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def handle_clerk_webhook(request: Request) -> dict[str, str]:
    body = await request.body()
    headers = dict(request.headers)

    try:
        wh = Webhook(settings.clerk_webhook_secret)
        payload: dict[str, Any] = json.loads(
            wh.verify(body, headers)
        )
    except WebhookVerificationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        ) from e

    event_type = payload.get("type", "")

    if event_type == "user.created":
        # TODO: sync user to founders table (implemented in auth feature)
        pass

    return {"status": "ok"}
```

Register router in `backend/src/main.py`:

```python
from src.api.auth import router as auth_router

app.include_router(auth_router)
```

- [ ] **Step 13: Create asyncpg connection pool stub**

`backend/src/db/connection.py`:

```python
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg

from src.core.config import settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=2,
        max_size=10,
    )


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    async with _pool.acquire() as conn:
        yield conn
```

Wire pool lifecycle into `backend/src/main.py` using a lifespan:

```python
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from src.db.connection import init_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_pool()
    yield
    await close_pool()


app = FastAPI(
    title="Entity API",
    version="0.1.0",
    description="AI-powered founder profiling and deal flow",
    lifespan=lifespan,
)
```

- [ ] **Step 14: Verify the dev server starts**

```bash
cd /Users/possible/Documents/Entity/backend
uv run uvicorn src.main:app --reload --port 8000 &
sleep 2
curl http://localhost:8000/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 15: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with health, CORS, JWT auth, rate limiting, DB pool, webhook handler"
```

---

### Task 5: Initialize Supabase

**Files:**

- Create: `supabase/config.toml`
- Create: `supabase/migrations/<timestamp>_init.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Initialize Supabase project**

```bash
cd /Users/possible/Documents/Entity
supabase init --workdir ./supabase
```

- [ ] **Step 2: Create the initial migration**

```bash
supabase migration new init --workdir ./supabase
```

This creates `supabase/migrations/<timestamp>_init.sql`. Populate it with the full Phase 1 schema from the design spec:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- Founders
CREATE TABLE founders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    linkedin_data JSONB,
    github_data JSONB,
    timezone TEXT,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_founders_clerk_user_id ON founders (clerk_user_id);
CREATE UNIQUE INDEX idx_founders_email ON founders (email);

-- Startup Profiles
CREATE TABLE startup_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    company_name TEXT,
    one_liner TEXT,
    market_category TEXT,
    stage TEXT CHECK (stage IN ('pre_seed', 'seed', 'series_a')),
    raise_amount BIGINT,
    pitch_sections JSONB,
    published_sections TEXT[],
    embedding extensions.vector(1536),
    embedding_model TEXT,
    embedded_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_startup_profiles_founder ON startup_profiles (founder_id);
CREATE INDEX idx_startup_profiles_active ON startup_profiles (founder_id) WHERE deleted_at IS NULL;

-- Signal Scores
CREATE TABLE signal_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_profile_id UUID NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
    overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    category_scores JSONB NOT NULL,
    signal_details JSONB NOT NULL,
    engagement_quality_score SMALLINT CHECK (engagement_quality_score BETWEEN 0 AND 100),
    scoring_version TEXT NOT NULL,
    scoring_config JSONB,
    triggered_by TEXT,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_signal_scores_profile ON signal_scores (startup_profile_id);
CREATE INDEX idx_signal_scores_overall ON signal_scores (overall_score DESC);
CREATE INDEX idx_signal_scores_computed ON signal_scores (computed_at DESC);
CREATE INDEX idx_signal_scores_categories ON signal_scores USING gin (category_scores);

-- Mentor Sessions
CREATE TABLE mentor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
    startup_profile_id UUID NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN (
        'big_picture', 'problem_market', 'business', 'ask', 'deep_dive'
    )),
    session_summary TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_mentor_sessions_founder ON mentor_sessions (founder_id);
CREATE INDEX idx_mentor_sessions_profile ON mentor_sessions (startup_profile_id);

-- Mentor Messages (normalized conversation history)
CREATE TABLE mentor_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mentor_messages_session ON mentor_messages (session_id, created_at);

-- Session Signals (normalized extracted signals)
CREATE TABLE session_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES mentor_messages(id) ON DELETE SET NULL,
    signal_key TEXT NOT NULL,
    signal_value JSONB NOT NULL,
    confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_signals_session ON session_signals (session_id);
CREATE INDEX idx_session_signals_key ON session_signals (signal_key);

-- Row-Level Security
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: founders see only their own data
CREATE POLICY "founders_self" ON founders
    FOR ALL USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "startup_profiles_owner" ON startup_profiles
    FOR ALL USING (
        founder_id IN (
            SELECT id FROM founders
            WHERE clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "signal_scores_owner" ON signal_scores
    FOR ALL USING (
        startup_profile_id IN (
            SELECT sp.id FROM startup_profiles sp
            JOIN founders f ON sp.founder_id = f.id
            WHERE f.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "mentor_sessions_owner" ON mentor_sessions
    FOR ALL USING (
        founder_id IN (
            SELECT id FROM founders
            WHERE clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "mentor_messages_owner" ON mentor_messages
    FOR ALL USING (
        session_id IN (
            SELECT ms.id FROM mentor_sessions ms
            JOIN founders f ON ms.founder_id = f.id
            WHERE f.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "session_signals_owner" ON session_signals
    FOR ALL USING (
        session_id IN (
            SELECT ms.id FROM mentor_sessions ms
            JOIN founders f ON ms.founder_id = f.id
            WHERE f.clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );
```

Note: Using `gen_random_uuid()` (PostgreSQL built-in) instead of `uuid_generate_v7()` because Supabase's local PostgreSQL may not have `pg_uuidv7` extension. Upgrade to UUIDv7 when extension is available or use application-level UUID generation.

Note: RLS policies use `current_setting('request.jwt.claims', true)` which is how Supabase PostgREST passes JWT claims to PostgreSQL. For direct asyncpg connections from FastAPI, the backend sets this config parameter on each connection.

- [ ] **Step 3: Create seed file**

`supabase/seed.sql`:

```sql
-- Dev seed data (empty for now — synthetic personas added in Month 2)
-- This file runs after migrations via `supabase db reset`
```

- [ ] **Step 4: Start Supabase and verify**

```bash
cd /Users/possible/Documents/Entity
supabase start --workdir ./supabase
```

Expected: Services start on ports 54321 (API), 54322 (DB), 54323 (Studio).

```bash
supabase db reset --workdir ./supabase
```

Expected: Migrations applied, tables created.

Verify by opening Supabase Studio at `http://127.0.0.1:54323` and confirming all 6 tables exist.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: initialize Supabase with Phase 1 schema, RLS policies, pgvector"
```

---

### Task 6: Create Makefile

**Files:**

- Create: `Makefile`

- [ ] **Step 1: Create Makefile**

`Makefile`:

```makefile
.PHONY: setup dev dev\:web dev\:api dev\:db test test\:web test\:api test\:e2e lint format typecheck db\:migrate db\:reset db\:seed db\:diff ci

# ──────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────

setup:
	@echo "Installing pnpm dependencies..."
	pnpm install
	@echo "Installing Python dependencies..."
	cd backend && uv sync
	@echo "Initializing Supabase..."
	supabase start --workdir ./supabase || true
	@echo "Creating .env from template..."
	@[ -f .env ] || cp .env.example .env
	@echo "Setup complete! Run 'make dev' to start all services."

# ──────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────

dev:
	npx concurrently \
		--names "web,api,db" \
		--prefix-colors "blue,green,yellow" \
		"pnpm --filter @entity/web dev" \
		"cd backend && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" \
		"supabase start --workdir ./supabase"

dev\:web:
	pnpm --filter @entity/web dev

dev\:api:
	cd backend && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev\:db:
	supabase start --workdir ./supabase

# ──────────────────────────────────────────────
# Testing
# ──────────────────────────────────────────────

test: test\:web test\:api

test\:web:
	pnpm --filter @entity/web test

test\:api:
	cd backend && uv run pytest -v

test\:e2e:
	pnpm --filter @entity/web exec playwright test

# ──────────────────────────────────────────────
# Code Quality
# ──────────────────────────────────────────────

lint:
	pnpm --filter @entity/web lint
	cd backend && uv run ruff check .

format:
	cd backend && uv run ruff format .

typecheck:
	pnpm --filter @entity/web exec tsc --noEmit
	cd backend && uv run pyright

# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────

db\:migrate:
	supabase db push --workdir ./supabase

db\:reset:
	supabase db reset --workdir ./supabase

db\:seed:
	supabase db reset --workdir ./supabase

db\:diff:
	supabase db diff --workdir ./supabase

# ──────────────────────────────────────────────
# CI (mirrors GitHub Actions)
# ──────────────────────────────────────────────

ci: lint typecheck test
```

- [ ] **Step 2: Verify Makefile targets**

```bash
cd /Users/possible/Documents/Entity
make test
```

Expected: Both web and api tests pass.

- [ ] **Step 3: Commit**

```bash
git add Makefile
git commit -m "feat: add Makefile with unified dev, test, lint, db commands"
```

---

### Task 7: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Install JS dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Python dependencies
        run: cd backend && uv sync

      - name: Lint frontend
        run: pnpm --filter @entity/web lint

      - name: Lint backend
        run: cd backend && uv run ruff check .

      - name: Typecheck frontend
        run: pnpm --filter @entity/web exec tsc --noEmit

      - name: Typecheck backend
        run: cd backend && uv run pyright

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm --filter @entity/web test

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: astral-sh/setup-uv@v4
        with:
          version: "latest"

      - name: Install dependencies
        run: cd backend && uv sync

      - name: Run tests
        run: cd backend && uv run pytest -v
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow for lint, typecheck, and tests"
```

---

### Task 8: Verify Full Stack

**Files:** None (verification only)

- [ ] **Step 1: Run make setup from scratch**

```bash
cd /Users/possible/Documents/Entity
make setup
```

Expected: All dependencies installed, Supabase started, .env created.

- [ ] **Step 2: Run make dev**

```bash
make dev
```

Expected: Three services start with labeled output:

- `[web]` Next.js on http://localhost:3000
- `[api]` FastAPI on http://localhost:8000
- `[db]` Supabase Studio on http://127.0.0.1:54323

- [ ] **Step 3: Verify each service**

In a new terminal:

```bash
# Frontend
curl -s http://localhost:3000 | head -5
# Should return HTML

# Backend
curl -s http://localhost:8000/health
# Should return {"status":"ok"}

# Supabase Studio
curl -s http://127.0.0.1:54323 | head -5
# Should return HTML
```

- [ ] **Step 4: Run make ci**

```bash
make ci
```

Expected: lint + typecheck + test all pass.

- [ ] **Step 5: Kill dev servers and commit**

```bash
# Ctrl+C to stop make dev
git add -A
git commit -m "chore: verify full stack integration"
```

---

### Task 9: Create README

**Files:**

- Create: `README.md`

- [ ] **Step 1: Create root README**

`README.md`:

````markdown
# Entity

AI-powered founder profiling and deal flow platform.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Docker (required by Supabase CLI)

## Setup

```bash
git clone <repo-url> && cd entity
make setup
```
````

Copy `.env.example` to `.env` and fill in your API keys:

- [Clerk](https://clerk.com) — create an application, get publishable + secret keys
- [Anthropic](https://console.anthropic.com) — get API key

## Development

```bash
make dev          # Start all services (Next.js :3000, FastAPI :8000, Supabase Studio :54323)
make dev:web      # Frontend only
make dev:api      # Backend only
make dev:db       # Database only
```

## Testing

```bash
make test         # All tests
make test:web     # Frontend (Vitest)
make test:api     # Backend (pytest)
make test:e2e     # E2E (Playwright)
```

## Code Quality

```bash
make lint         # ESLint + Ruff
make format       # Prettier + Ruff format
make typecheck    # tsc + pyright
make ci           # Full CI pipeline (lint + typecheck + test)
```

## Database

```bash
make db:migrate   # Run pending migrations
make db:reset     # Reset and re-seed
make db:diff      # Auto-generate migration from changes
```

## Project Structure

```
entity/
├── apps/web/          # Next.js 15+ frontend
├── packages/ui/       # Shared UI components (@entity/ui)
├── backend/           # FastAPI Python backend
├── supabase/          # Database migrations and config
└── docs/              # Design specs and plans
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind 4, shadcn/ui
- **Backend:** FastAPI, Python 3.12, Pydantic v2
- **Database:** Supabase (PostgreSQL 16 + pgvector)
- **Auth:** Clerk (LinkedIn, GitHub, Google OAuth)
- **AI:** Claude API + Instructor

````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add root README with setup instructions"
````

---

## Summary

| Task | What it delivers                                                      | Est. time |
| ---- | --------------------------------------------------------------------- | --------- |
| 1    | Git, root config, .env.example                                        | 3 min     |
| 2    | Next.js 15 + Tailwind 4 + Clerk + Vitest                              | 15 min    |
| 3    | @entity/ui package with shadcn Button                                  | 10 min    |
| 4    | FastAPI + CORS + JWT auth + rate limiting + DB pool + webhook handler | 15 min    |
| 5    | Supabase + Phase 1 schema + RLS + pgvector                            | 8 min     |
| 6    | Makefile (dev, test, lint, db, ci)                                    | 5 min     |
| 7    | GitHub Actions CI                                                     | 3 min     |
| 8    | Full stack verification                                               | 5 min     |
| 9    | Root README with setup instructions                                   | 2 min     |

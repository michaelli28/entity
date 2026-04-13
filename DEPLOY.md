# Deploying ZStar

Three services. Each has a different home:

| Service            | Host           | Why                                  |
| ------------------ | -------------- | ------------------------------------ |
| `apps/web` (Next)  | **Vercel**     | Edge CDN, preview URLs, free tier    |
| `backend` (FastAPI)| **Railway**    | Long-running uvicorn, SSE streaming  |
| Postgres + pgvector| **Supabase**   | Managed, RLS, already in your stack  |

Follow top-to-bottom. Each step assumes the previous one finished.

---

## 0. Pre-flight (5 min)

You need accounts on all three. If you haven't, sign up now — free tiers cover this:

- Supabase: https://supabase.com/dashboard/sign-up
- Railway:  https://railway.com (GitHub sign-in recommended — Railway reads your repo)
- Vercel:   https://vercel.com/signup (again, GitHub sign-in)

You'll also need production **Clerk** keys — go to https://dashboard.clerk.com, create a new *production* instance (you currently have a dev/test one: `first-lynx-19`).

Push this repo to GitHub if it isn't already:

```bash
gh repo create zstar --private --source=. --remote=origin --push
```

---

## 1. Supabase — production database (10 min)

1. Dashboard → **New project** → name: `zstar-prod` → strong DB password → region closest to your users.
2. Wait ~2 min for provisioning.
3. Grab these from **Project Settings**:
   - **Project URL** → `SUPABASE_URL` (e.g. `https://xxxx.supabase.co`)
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (under "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`
   - **Connection string** (Database → Connect → *Session pooler*) → `DATABASE_URL`
4. Enable `pgvector`: SQL Editor → paste → run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Run migrations from your laptop (links local CLI to cloud project):
   ```bash
   cd /Users/possible/Documents/Zstar
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   `<your-project-ref>` is the hash in your project URL (`https://<ref>.supabase.co`).

✅ You now have a production DB with the full schema.

---

## 2. Clerk — production instance (5 min)

1. https://dashboard.clerk.com → **Create application** → *Production* → enable email + LinkedIn/Google/GitHub OAuth (match dev).
2. Copy these from **API keys**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts `pk_live_`)
   - `CLERK_SECRET_KEY` (starts `sk_live_`)
3. **JWT Templates** → create a new template called `backend` → lifetime 60 min → claims:
   ```json
   { "sub": "{{user.id}}", "email": "{{user.primary_email_address}}" }
   ```
4. Copy **JWKS URL** (Configure → API keys → Advanced) → `CLERK_JWKS_URL`.
5. **Webhooks** → will be configured later once Railway is up; leave open in a tab.

---

## 3. Railway — backend deploy (15 min)

1. https://railway.com/new → **Deploy from GitHub repo** → pick your `zstar` repo.
2. Railway detects multiple services. Configure **only** the backend:
   - Settings → **Root Directory**: `backend`
   - Settings → **Builder**: Dockerfile (it'll auto-detect `backend/Dockerfile`)
3. **Variables** tab → paste all of these (values from Supabase + Clerk + your Anthropic key):
   ```
   ENVIRONMENT=production
   DATABASE_URL=<from Supabase step 1.3>
   SUPABASE_URL=<from Supabase step 1.3>
   SUPABASE_SERVICE_ROLE_KEY=<from Supabase step 1.3>
   CLERK_SECRET_KEY=<from Clerk step 2.2>
   CLERK_JWKS_URL=<from Clerk step 2.4>
   CLERK_ISSUER=<your-clerk-frontend-api-url, e.g. https://clerk.zstar.ai>
   CLERK_WEBHOOK_SECRET=<will be filled in step 5>
   ANTHROPIC_API_KEY=<your Anthropic prod key>
   FRONTEND_URL=https://<your-vercel-domain>.vercel.app   # update after step 4
   ```
4. **Networking** tab → **Generate Domain** — you'll get something like `zstar-api.up.railway.app`. Copy it.
5. Railway will build + deploy automatically. Watch the logs. Once `/health` returns 200 (check: `curl https://zstar-api.up.railway.app/health`) you're live.

✅ Backend is live on Railway at `https://<your-railway-domain>`.

---

## 4. Vercel — frontend deploy (10 min)

1. https://vercel.com/new → **Import Git Repository** → pick `zstar`.
2. Configuration:
   - **Root Directory**: `apps/web`
   - **Framework preset**: Next.js (auto-detected)
   - **Build/Install commands**: leave as-is — `vercel.json` handles the pnpm-workspace build.
3. **Environment Variables** → paste:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk step 2.2>
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   CLERK_SECRET_KEY=<from Clerk step 2.2>
   CLERK_WEBHOOK_SECRET=<from step 5 below>
   CLERK_JWKS_URL=<from Clerk step 2.4>
   NEXT_PUBLIC_SUPABASE_URL=<from Supabase step 1.3>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase step 1.3>
   NEXT_PUBLIC_API_URL=https://<your-railway-domain>
   ```
4. **Deploy**. First build takes ~3 min.
5. Vercel gives you `zstar.vercel.app` (or similar). Open it → click sign-in → should redirect to Clerk → back to `/dashboard`.

✅ Frontend is live.

---

## 5. Clerk webhook (3 min)

Now Clerk needs to tell Railway about new signups.

1. Clerk Dashboard → **Webhooks** → **Add endpoint**:
   - Endpoint URL: `https://<your-railway-domain>/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
2. Copy the **Signing Secret** (`whsec_...`).
3. Add it to **both** Railway and Vercel as `CLERK_WEBHOOK_SECRET` (redeploy both — Railway auto-redeploys on var change, Vercel needs a manual redeploy from the Deployments tab).

---

## 6. Clerk — allowed origins / redirect URLs (2 min)

Clerk Dashboard → **Domains & URLs**:

- **Frontend API**: your production Clerk frontend (auto-set)
- **Allowed Origins**: add `https://zstar.vercel.app` (or your custom domain)
- **Redirect URLs** (both sign-in and sign-up): `https://zstar.vercel.app/dashboard`, `https://zstar.vercel.app/onboarding`

---

## 7. Smoke test (5 min)

```bash
curl https://<your-railway-domain>/health
# {"status":"ok"}

# In browser:
open https://zstar.vercel.app
# → /sign-in → sign up with a fresh account → /onboarding → /dashboard
```

Click **Fill test data** (sidebar, dev only — will 403 in production because `ENVIRONMENT=production`). If you want the button in prod too, remove the gate in `backend/src/api/dev.py`.

---

## 8. Custom domain (optional, 10 min)

If you own `zstar.ai`:

1. Vercel → Project → Domains → add `zstar.ai` → follow DNS instructions (A/CNAME).
2. Railway → Backend → Networking → Custom Domain → `api.zstar.ai`.
3. Update Vercel env: `NEXT_PUBLIC_API_URL=https://api.zstar.ai`, redeploy.
4. Update Clerk allowed origins/redirect URLs to the new domain.
5. Update Clerk webhook endpoint to `https://api.zstar.ai/api/webhooks/clerk`.

---

## Rollback

Every deploy on both Vercel and Railway is a frozen artifact. If something breaks:

- Vercel: Deployments → previous → **Promote to Production**.
- Railway: Deployments → previous → **Redeploy**.

---

## Recurring gotchas

- **Vercel build fails on pnpm workspace**: `vercel.json` already handles this (`cd ../..` trick). If you change the workspace root, update the `buildCommand`.
- **CORS error from Railway**: `backend/src/core/cors.py` reads origins from env — add `FRONTEND_URL=https://zstar.vercel.app` to Railway vars if it's not auto-inferring.
- **Clerk JWT verification fails**: `CLERK_JWKS_URL` must match your production instance, not dev.
- **Stream endpoint times out**: Railway's default request timeout is 5 min — should be plenty for SSE. If you see gateway 524s, bump it in Railway Settings.
- **Supabase connection exhaustion**: use the *Session pooler* URL, not the *Transaction pooler*, for FastAPI — asyncpg holds connections for the pool lifetime.

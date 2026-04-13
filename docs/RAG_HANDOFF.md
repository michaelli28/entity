# RAG — Morning Handoff

## What shipped overnight

Branch: `feat/rag-research-papers` off `feat/redesign-phase-2`.

### End-to-end state (all committed)

- **Phase 0** — deps (`openai`, `pypdf`, `tiktoken`), `RagMode` enum, fail-fast key validation, shared `CategoryKey` literal.
- **Phase 1** — migration `20260413000000_research_rag.sql` applied locally. `research_papers` + `research_chunks` with `chunking_version` uniqueness, RLS on, no HNSW (seq scan <5ms at this size).
- **Phase 2** — `AsyncOpenAI` embeddings client with `max_retries=3`, batching at 100.
- **Phase 3** — `pypdf` parser (section detection, PII scrub) + `tiktoken.o200k_base` chunker (1500 tokens, 200 overlap, `CHUNKING_VERSION=1`).
- **Phase 4** — `scripts/ingest_papers.py`: idempotent by `(sha256, chunking_version)`, per-paper DB transaction, `--force` flag.
- **Phase 5** — retriever (`retrieve`, `retrieve_by_embedding`), `RetrievedChunk` frozen dataclass, pgvector cosine.
- **Phase 6** — `build_grounding_from_chunks` (`<research_chunk id="N" paper="..." section="...">` wrapper), citation validator (regex extract, orphan drop, dedupe), `Citation` Pydantic schema with **server-enforced 150-word snippet cap**.
- **Phase 7** — pre-registered recall eval: **14/15 top-3 (93%, gate was 80%)**.
- **Phase 8** — mentor chat grounding: `build_chat_grounding` helper (gated on `RagMode`, silent fallback), injected into `build_messages_and_system` via optional `Grounding` param, `MENTOR_IDENTITY` prompt updated with `[N]` citation instruction, post-stream `validate_citations` + `citations` SSE event, **`@limiter.limit("20/minute")`** on `/api/chat/stream`.
- **Phase 9** — mentor summary grounding: `build_summary_grounding` (**FULL mode only**, single broad retrieval, k=8), `generate_mentor_summary` accepts optional `Grounding`, `/api/scores/mentor-summary` validates citations across `headline`/`strengths`/`weaknesses`/`tips` and returns a `citations[]` array. **`@limiter.limit("10/minute")`**.

### Actual data ingested

7 PDFs → 159 chunks in local dev DB:

```
B&E.pdf            17 chunks
paper 1.pdf        30 chunks   Alumni networks + VC financing
paper 2.pdf        24 chunks   Early industry exposure → success
Paper 3.pdf        22 chunks   Dinner-table human capital
Paper 4.pdf        16 chunks   Founding team uniformity
ssrn-2643790.pdf   33 chunks   VC competitor ties + innovation
ssrn-2939378.pdf   17 chunks   Persistence + immigrant founders
```

Cost to embed: ~$0.01 total.

### Tests

- **101 unit tests passing** (from 45 pre-existing): categories (4), config-rag (6), embeddings (6), parsing (6), chunking (11), ingest (5), grounding (7), citations (6), citation-schema (6), chat-grounding (4), summary-grounding (5), plus the 45 pre-existing.
- **6/6 schema integration tests passing**.
- **5/5 retriever integration tests passing**.
- **1/1 recall eval passing (14/15 queries → top-3)**.
- **1 pre-existing flaky test** (`test_off_topic_returns_canned_response` — OFF_TOPIC misclassification, memory S119, unrelated to RAG).

### End-to-end smoke

Ran `build_chat_grounding("how do alumni networks affect venture capital investments") → retrieve → <research_chunk> block → validate_citations("…[1]…[99]…[2]…")`. Orphan `[99]` correctly stripped, `[1]` and `[2]` resolved to `paper 1`.

---

## What's deferred to you

### 1. Flip the flag in dev and test (5 min)

Currently `RAG_MODE=off`. To try it:

```
# backend/.env
RAG_MODE=mentor_only   # mentor chat gets citations
# or
RAG_MODE=full          # chat + summary both grounded
```

Restart the FastAPI server and hit the mentor chat. SSE responses will include a new `citations` event between the last token and `done`.

### 2. Frontend citation rendering (Phase 8.4 / 9.5) — NOT BUILT

I deliberately skipped frontend changes because they need visual verification. The backend **already emits** citations via SSE (chat) and the JSON payload (summary). You need:

- `apps/web/src/components/shared/CitationPopover.tsx` — new component, renders `[N]` as superscript pill, popover shows `title` / `section` / `snippet`.
- `apps/web/src/components/mentor/MessageBubble.tsx` — parse `[N]` tokens in assistant messages, render through `CitationPopover`.
- `apps/web/src/components/scores/MentorSummarySection.tsx` — same, across headline + lists.
- `apps/web/e2e/mentor-citations.spec.ts` — Playwright: message with `[N]` renders pill, popover shows capped snippet.

SSE shape for chat (new event):
```
event: citations
data: {"citations": [{"index": 1, "paper_id": "…", "paper_title": "paper 1", "section": "introduction", "snippet": "… (≤150 words)"}]}
```

Summary shape (new field on existing JSON response):
```json
{
  "headline": "…[1]…",
  "strengths": ["…[1]…", …],
  "weaknesses": [],
  "tips": [],
  "citations": [{"index": 1, "paper_id": "…", "paper_title": "…", "section": "…", "snippet": "…"}]
}
```

### 3. Faithfulness eval (Phase 7.4) — deferred

Plan called for a 10-turn LLM-as-judge eval. I deferred it because it depends on Phase 8 wiring being live. Now that it is, you can:

1. Create `backend/tests/integration/test_faithfulness_eval.py`.
2. Call the live `/api/chat/stream` (with `RAG_MODE=mentor_only`) with 10 realistic mentor-style prompts.
3. For each cited `[N]` in the response, pass `(citation snippet, claim-in-text)` to Haiku with a supported/unsupported prompt.
4. Gate: ≥8/10 cited refs marked supported.

Not blocking prod — the recall gate is the primary safety net.

### 4. Sentry / structlog scrub (Phase 10.1) — deferred

Before prod, add a `before_send` Sentry filter that scrubs keys `content`, `chunk_content`, `embedding`, `snippet` from event data so copyrighted text never leaks to third-party observability. Low-lift; the hook point is `backend/src/core/sentry.py`.

### 5. Prod rollout (Phase 10.2 / 10.3) — your call

Plan: `mentor_only` in staging for 1 week → if stable, flip to `full`. I didn't deploy anything to Railway/Vercel — all changes are on the local branch. Railway auto-deploys from the branch if push triggers are configured (memory 1556 says no triggers set, so this is manual).

---

## Commit log on this branch

```
fc78898 feat(scores): ground mentor summary with single broad retrieval + validated citations
0c54dca feat(api): rate-limit mentor chat to 20/min
a72c575 feat(mentor): ground chat in research papers with safe fallback + validated citations
84e90dd test(rag): pre-registered recall eval — 14/15 pass on real corpus
b41fc9a feat(rag): transactional idempotent paper ingestion script
[phase 6] feat(rag): grounding, citation validator, and capped Citation schema
2fbfaa4 feat(rag): retriever with pre-embedded variant for batched callers
904448a feat(rag): o200k_base-tokenized chunker, 1500/200, versioned
d9cef46 feat(rag): PDF parsing with section detection + PII scrub
af37864 feat(llm): async OpenAI embeddings client with built-in retries
4f120f0 feat(db): add research_papers + research_chunks with chunking_version
bde3b57 feat(config): RagMode enum + fail-fast OpenAI key validation
83706ba refactor(core): share CategoryKey literal between scores and future RAG
60c8c01 chore(backend): add openai, pypdf, tiktoken for RAG pipeline
e5bfffb chore(rag): relocate research PDFs + spec+plan
```

## Gotchas I hit

- **File vanished after branch flip**: mid-session git checkout to `main` (unclear what triggered it) made new files appear untracked; had to `git show` + re-write. All recoverable; nothing lost.
- **Orthogonal synthetic test vectors**: pgvector cosine of two distinct unit vectors is 0, which fails the default `min_score=0.3`. Tests that seed synthetic vectors pass `min_score=-1.0`.
- **`pymupdf` rejected** upfront (AGPL) in favor of `pypdf` — ingestion runs fine on all 7 papers.
- **Rate limiter keys by `get_remote_address`**, not user_id. Good enough for MVP but if you want per-user limits later, pass a custom `key_func` reading `claims["sub"]`.

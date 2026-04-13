# Plan — RAG: Research Papers (rev 2, post-review)

**Spec:** `docs/superpowers/specs/2026-04-13-rag-research-papers.md` (rev 2)
**Branch:** `feat/rag-research-papers` (created off `feat/redesign-phase-2`).
**Approach:** TDD. Every phase: write test → run (fail) → implement → run (pass) → commit.

Fixes folded in from architect + python-reviewer + security-reviewer + ai-architect review.

---

## Phase 0 — Setup

**0.1 Move papers + gitignore**
- `mkdir -p backend/data/papers`
- `mv papers/*.pdf backend/data/papers/`
- `rmdir papers`
- Add to root `.gitignore`: `backend/data/papers/*.pdf`
- Add `backend/data/papers/.gitkeep`
- Commit: `chore(rag): relocate research PDFs to backend/data/papers (gitignored)`

**0.2 Add dependencies**
- `cd backend && uv add openai pypdf tiktoken`  ← **pypdf not pymupdf (AGPL)**
- Verify: `openai>=1.50`, `pypdf>=4.3`, `tiktoken>=0.8`
- Commit: `chore(backend): add openai, pypdf, tiktoken for RAG pipeline`

**0.3 Shared category type**
- Create `backend/src/core/categories.py` with `CategoryKey` Literal + `CATEGORIES` tuple.
- Refactor `backend/src/api/scores.py` to import from it.
- RED: `backend/tests/core/test_categories.py` — assert `CATEGORIES` has exactly 8 entries and each matches `CategoryKey`.
- Commit: `refactor(core): share CategoryKey literal type between scores and future RAG`

**0.4 Config — RagMode enum + fail-fast validator**
- Add `RagMode` enum (`off` / `mentor_only` / `full`) to `backend/src/core/config.py`.
- Add `rag_mode: RagMode = RagMode.OFF` and `openai_api_key: str | None = None`.
- Add `@model_validator(mode="after")` raising if `rag_mode != OFF` and `openai_api_key` missing.
- RED: `backend/tests/core/test_config.py::test_rag_mode_requires_openai_key`.
- Add to `.env.example`: `RAG_MODE=off`, `OPENAI_API_KEY=`.
- Commit: `feat(config): RagMode enum + fail-fast OpenAI key validation`

---

## Phase 1 — Schema

**1.1 Migration**
- Write `supabase/migrations/20260413000000_research_rag.sql` per spec §1 (no HNSW, `chunking_version` in unique key, RLS service-role only).
- RED: `backend/tests/db/test_research_rag_schema.py` — tables exist, unique on `(sha256, chunking_version)`, no HNSW index.
- Apply migration locally.
- Commit: `feat(db): add research_papers + research_chunks with chunking_version`

---

## Phase 2 — Async embedding client

**2.1 `backend/src/llm/embeddings.py`**
- RED: `backend/tests/llm/test_embeddings.py`
  - `test_embed_returns_1536_floats`
  - `test_embed_batch_preserves_order`
  - `test_embed_batch_chunks_at_100` (>100 inputs → multiple requests)
  - `test_uses_async_client` (inspect type)
  - OpenAI client mocked; no live calls.
- GREEN: `OpenAIEmbedder` using `AsyncOpenAI(api_key=..., max_retries=3)`.
- Commit: `feat(llm): async OpenAI embeddings client with built-in retries`

---

## Phase 3 — PDF parsing + chunking

**3.1 `backend/src/rag/parsing.py`**
- RED: `backend/tests/rag/test_parsing.py`
  - `test_pypdf_extracts_text` (fixture: tiny 2-page PDF in `tests/fixtures/`)
  - `test_detects_common_sections` (Abstract / Introduction / etc.)
  - `test_falls_back_to_whole_doc`
  - `test_scrubs_emails` (PII regex removes `foo@bar.edu` lines)
- GREEN: `parse_pdf(path) -> list[Section]` using `pypdf`.
- Commit: `feat(rag): PDF parsing with section detection + PII scrub`

**3.2 `backend/src/rag/chunking.py`**
- Export `CHUNKING_VERSION: int = 1`.
- Use `tiktoken.get_encoding("o200k_base")` — **not** `cl100k_base`.
- Target 1500 tokens, 200-token overlap.
- RED: `backend/tests/rag/test_chunking.py`
  - `test_chunks_respect_target_tokens` (~1500 ±200)
  - `test_chunks_overlap_by_200`
  - `test_short_section_is_single_chunk`
  - `test_no_content_lost`
  - `test_tokenizer_is_o200k_base`
- Commit: `feat(rag): o200k_base-tokenized chunker, 1500/200, versioned`

---

## Phase 4 — Ingestion

**4.1 `backend/scripts/ingest_papers.py`**
- RED: `backend/tests/scripts/test_ingest_papers.py`
  - `test_ingest_is_idempotent` (run twice → same chunk count)
  - `test_force_reingests`
  - `test_chunking_version_bump_triggers_reingest`
  - `test_partial_failure_rolls_back` (embed fails mid-paper → no row, no chunks)
  - `test_batch_embedding_call_count` (100 chunks → 1 embed call)
- GREEN:
  - Per-paper `async with conn.transaction():` wraps paper insert + bulk chunk insert + count update.
  - Uses `OpenAIEmbedder.embed(all_chunks_for_paper)` — batched internally at 100.
  - Skips by `(sha256, chunking_version)` unless `--force`.
- Manual: `uv run python -m scripts.ingest_papers` against dev DB → real 7 papers ingested.
- Commit: `feat(rag): transactional idempotent paper ingestion`

---

## Phase 5 — Retriever

**5.1 `backend/src/rag/retriever.py`**
- `RetrievedChunk` (frozen dataclass).
- Two functions: `retrieve(query, ...)` and `retrieve_by_embedding(embedding, ...)`.
- RED: `backend/tests/rag/test_retriever.py`
  - `test_retrieve_returns_top_k_ordered_by_similarity`
  - `test_min_score_filter`
  - `test_retrieve_by_embedding_matches_retrieve` (same results when given matching embedding)
  - `test_includes_paper_metadata`
  - `test_empty_query_raises`
- GREEN: pgvector seq scan (`order by embedding <=> $1`).
- Commit: `feat(rag): retriever with pre-embedded variant for batched callers`

---

## Phase 6 — Grounding service + citation validator + snippet schema

**6.1 `backend/src/rag/grounding.py`**
- `Grounding` dataclass: `chunks: list[RetrievedChunk]`, `prompt_block: str`.
- Wraps each chunk in `<research_chunk id="N" paper="..." section="...">...</research_chunk>`.
- RED: `backend/tests/rag/test_grounding.py`
  - `test_chunks_wrapped_in_delimiter_tags`
  - `test_numbering_matches_retrieval_order`
  - `test_empty_retrieval_returns_empty_grounding`
- Commit: `feat(rag): grounding builder with <research_chunk> delimiters`

**6.2 `backend/src/rag/citations.py`**
- `validate_citations(text: str, grounding: Grounding) -> tuple[str, list[Citation]]`.
- Regex `\[(\d+)\]` → drop any N not in retrieved set.
- RED: `backend/tests/rag/test_citations.py`
  - `test_valid_citations_pass_through`
  - `test_orphan_citation_removed_from_text`
  - `test_duplicate_citation_deduped`
  - `test_returns_only_cited_chunks`
- Commit: `feat(rag): post-generation citation validator`

**6.3 `backend/src/api/schemas/citations.py` (Pydantic)**
- `Citation` model with `MAX_SNIPPET_WORDS = 150` and a `@field_validator("snippet")` that truncates on last sentence boundary before the cap.
- RED: `backend/tests/api/test_citation_schema.py`
  - `test_snippet_truncates_at_150_words`
  - `test_truncation_on_sentence_boundary`
  - `test_full_chunk_never_returned` (feeding a long content produces capped snippet)
- Commit: `feat(api): Citation schema with server-side snippet cap`

---

## Phase 7 — Eval gate (BLOCKING)

**7.1 Query set (pre-registered)**
- Commit `backend/tests/rag/fixtures/eval_queries.json` with 15 queries **before** tuning any RAG parameter. Each query lists the paper(s) expected in top-3.
- Commit: `test(rag): pre-registered eval query set`

**7.2 Pinned embedding fixtures**
- `backend/tests/rag/fixtures/paper_embeddings.json` — real embeddings for the 7 papers (chunks + query embeddings) captured once, committed.
- CI loads fixtures into a test Postgres; no live OpenAI calls.
- Commit: `test(rag): pinned embedding fixtures for hermetic eval`

**7.3 Recall eval**
- `backend/tests/rag/test_retrieval_eval.py::test_top_3_recall_at_80_percent` — gate ≥12/15.

**7.4 Faithfulness eval**
- `backend/tests/rag/test_faithfulness_eval.py`
- 10 mentor turns with full retrieval + model generation + citation validation.
- LLM-as-judge (Haiku) rates each `[N]` → supported / unsupported.
- Gate: ≥80% cited refs marked supported.
- **Both evals must pass before any Phase 8+ wiring.**
- Commit: `test(rag): recall + citation faithfulness eval gates`

---

## Phase 8 — Mentor chat grounding

**8.1 Grounding call in chat handler (flag=MENTOR_ONLY or FULL)**
- RED: `backend/tests/api/test_chat_grounding.py`
  - `test_grounding_called_when_flag_on`
  - `test_retrieval_failure_falls_back_silently` (DB error → chat still returns 200)
  - `test_no_grounding_when_flag_off`
- GREEN: `chat.py` calls `build_grounding(user_message, k=4)`; appends `prompt_block` to system prompt; wraps retrieval in try/except → log + empty grounding on failure.
- Update mentor prompt (`backend/src/llm/prompts.py`) with the `<research_chunk>` instruction.
- Commit: `feat(mentor): ground chat in research papers with safe fallback`

**8.2 Citation validation + API response**
- RED: `backend/tests/api/test_chat_citations.py`
  - `test_response_includes_citations`
  - `test_orphan_citations_stripped`
  - `test_snippet_is_capped`
- GREEN: chat handler runs `validate_citations`, returns `{content, citations: [Citation]}`.
- Commit: `feat(api): mentor chat returns validated citations with capped snippets`

**8.3 Rate limiting**
- Add `slowapi` `@limiter.limit("20/minute")` to chat turn endpoint, keyed by `user_id`.
- RED: `backend/tests/api/test_chat_rate_limit.py`.
- Commit: `feat(api): rate-limit mentor chat to 20/min per user`

**8.4 Frontend — CitationPopover + MessageBubble**
- New `apps/web/src/components/shared/CitationPopover.tsx`.
- Update `MessageBubble.tsx` to parse `[N]` and render inline.
- Playwright: `apps/web/e2e/mentor-citations.spec.ts`.
- Commit: `feat(web): render mentor chat citations with popover`

**8.5 Flip `RAG_MODE=mentor_only` in dev + smoke**
- Manual: 5 mentor turns across paper topics; verify citations render, content is relevant, popovers show capped snippet.
- Commit: `chore(rag): enable MENTOR_ONLY in dev after smoke test`

---

## Phase 9 — Mentor summary grounding (single retrieval)

**9.1 Conversation-theme query builder**
- `backend/src/rag/summary_query.py::build_summary_query(conversation: str) -> str`.
- Minimal: take first 500 chars of the flattened user turns + short instruction suffix.
- RED: `backend/tests/rag/test_summary_query.py` — deterministic output, length capped, no leakage.
- Commit: `feat(rag): derive summary retrieval query from conversation`

**9.2 Ground `generate_mentor_summary`**
- RED: `backend/tests/llm/test_mentor_summary_grounding.py`
  - `test_single_retrieval_when_flag_full` (1 embed call, 1 SQL query, k=8)
  - `test_no_retrieval_when_flag_not_full`
  - `test_evidence_block_in_instructor_prompt`
  - `test_citation_validation_applied_to_all_text_fields` (headline, strengths, weaknesses, tips)
  - `test_retrieval_failure_falls_back_silently`
- GREEN: modify `generate_mentor_summary` to call `build_grounding(build_summary_query(...), k=8)` when `rag_mode == FULL`; inject into Instructor system prompt; validate citations on returned text fields.
- Response gains `citations` (sibling to summary, not in `MentorSummary` schema — API shape, not extractor shape).
- Commit: `feat(extractors): ground mentor summary with single broad retrieval + validated citations`

**9.3 Rate limit on `/api/scores/mentor-summary`**
- Add `@limiter.limit("10/minute")` per user_id.
- Commit: `feat(api): rate-limit mentor-summary endpoint`

**9.4 Integration test**
- `backend/tests/api/test_scores_grounded.py` — seeded conversation + pinned fixture embeddings → `GET /api/scores/mentor-summary` returns `citations` with ≥1 entry; all `snippet` fields ≤150 words.
- Commit: `test(api): mentor summary grounding end-to-end`

**9.5 Frontend — cite summary fields**
- Update `MentorSummarySection.tsx` to render `[N]` in headline/strengths/weaknesses/tips with `CitationPopover`.
- Commit: `feat(web): mentor summary citations with popover`

**9.6 Flip `RAG_MODE=full` in dev + smoke**
- Verify: summary references papers, citations match the displayed summary, popover snippets within 150 words.
- Commit: `chore(rag): enable FULL mode in dev after smoke test`

---

## Phase 10 — Observability + prod rollout

**10.1 Sentry / structlog scrub**
- Add `before_send` Sentry filter stripping keys `content`, `chunk_content`, `embedding`, `snippet`.
- Add structlog processor to strip same keys from bound context.
- RED: `backend/tests/core/test_observability_scrub.py`.
- Commit: `feat(observability): scrub RAG content from Sentry and structlog`

**10.2 Deploy to staging (`RAG_MODE=mentor_only`)**
- Push branch; Vercel preview + Railway deploy.
- Run eval in CI (recall + faithfulness) — must pass.
- Smoke via Playwright headed run.
- Deploy to prod staging channel. Monitor 1 week: Sentry errors, OpenAI cost, chat latency (expect +100–150ms for retrieval + validation).

**10.3 Prod cutover to FULL**
- After 7 days of `MENTOR_ONLY` stability, flip to `FULL`.
- Monitor mentor summary latency + faithfulness (sample 10 prod summaries, rerun judge offline).

---

## Rollback

Single env change: `RAG_MODE=off` stops all retrieval. Migration additive; no DDL rollback.

## Definition of Done

- [ ] 7 papers ingested; `select count(*) from research_chunks` > 0
- [ ] Recall eval ≥12/15 top-3
- [ ] Faithfulness eval ≥8/10 supported citations
- [ ] Mentor chat shows `[N]` citations with 150-word popover
- [ ] Mentor summary cites papers across headline/strengths/weaknesses/tips
- [ ] Rate limits enforced on both endpoints
- [ ] Sentry/structlog scrub verified in staging
- [ ] Coverage ≥80% on new modules; no regressions in existing tests

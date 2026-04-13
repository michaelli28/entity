# Citations UI + Per-Category Rationales

**Date:** 2026-04-13
**Branch:** feat/rag-research-papers
**Status:** Approved, ready to implement

## Goal

Three deliverables on top of the shipped RAG pipeline:

1. Render RAG citations in the mentor chat UI and the mentor summary UI.
2. Verify the mentor summary flow works end-to-end in production.
3. Generate a 1–2 sentence rationale per scoring category, grounded in the founder's conversations + profile (LinkedIn, GitHub, bio) + retrieved research chunks, and render it inline under each category score.

## Non-goals

- Reworking the scoring algorithm itself.
- Adding new research papers, new retrieval endpoints, or new LLM providers.
- Citation clickthrough to an external paper viewer (chip shows title + snippet; that's enough for V1).

## Architecture

### Backend

Extend the existing `MentorSummary` Pydantic model in `backend/src/llm/extractors.py`:

```python
class MentorSummary(BaseModel):
    headline: str
    strengths: list[str]
    weaknesses: list[str]
    tips: list[str]
    category_rationales: dict[CategoryName, str]  # NEW
    # citations is attached post-validation in scores.py
```

- `category_rationales` is a dict keyed by the 8 categories in `core/categories.py`.
- Each rationale is 1–2 sentences, grounded in: session transcripts (already aggregated), startup_profile fields (bio / linkedin_url / github_url / etc.), and the retrieved RAG chunks (already passed into the prompt).
- Generated in the **same Instructor call** as the rest of the summary — no new endpoint, no extra LLM hop.
- Prompt updated in `extractors.py` to instruct the model: "For each of the 8 categories, produce a 1–2 sentence rationale referencing specific evidence from the founder's own words and profile. Cite research using [n] inline when relevant."
- If the model fails to produce all 8 keys, Instructor retries; if still incomplete, fallback returns empty dict for missing keys (frontend handles gracefully).

### Frontend: citation shape + shared component

New shared component: `apps/web/src/components/rag/citation-chip.tsx`

- Accepts a `Citation[]`; renders numbered chips `[1] [2] [3]`.
- Click / hover opens a popover with `paper_title`, `section`, `snippet`.
- Uses existing shadcn `Popover` / `HoverCard` primitive — no new deps.

Zod schema added: `apps/web/src/lib/schemas/citation.ts` matching backend `Citation`.

### Frontend: chat integration

- `apps/web/src/lib/chat-stream.ts`: add `onCitations` handler to the SSE event loop.
- `apps/web/src/lib/schemas/chat.ts` (or wherever `ChatMessage` lives): add `citations?: Citation[]` to assistant messages.
- `message-bubble.tsx`: after rendering content, if `role === "assistant"` and `citations?.length`, render `<CitationChips citations={...} />` underneath.
- `message-list.tsx`: wire received `citations` event to the assistant message being streamed (attached after `done`).

### Frontend: summary integration

- `apps/web/src/components/scores/mentor-summary.tsx`:
  - Add a "Sources" row at the bottom rendering `citations` via `<CitationChips />`.
  - Respond data already includes `citations` — just consume it.

### Frontend: per-category rationales

- Extend `apps/web/src/lib/schemas/score.ts` summary schema to include `category_rationales: Record<CategoryName, string>`.
- `scores-view.tsx`: each of the 8 category cards gets a small muted-text line below `{v}/100` showing the rationale (truncate to ~140 chars with `line-clamp-2`; expand-on-click for full text).

## Data flow

1. User visits dashboard → `mentor-summary` query fires.
2. Backend aggregates transcripts + profile, runs RAG retrieval once (already implemented), calls Instructor with the extended prompt → returns `MentorSummary` including `category_rationales` + post-attached `citations`.
3. Frontend renders headline/strengths/weaknesses/tips + citation chips + per-category rationales on score cards.

## Error handling

- `category_rationales` missing a key → render card without rationale (no crash, no placeholder text).
- `citations` empty → don't render the Sources row or chips.
- Summary endpoint 5xx → existing error toast, unchanged.
- Rationales exceeding 2 sentences → trim client-side via `line-clamp-2`; no hard validation (trust model within reason).

## Testing

- Backend unit: extend existing `test_extractors_summary.py` to assert `category_rationales` has all 8 keys and each value is non-empty when model succeeds.
- Backend unit: fallback path — simulate missing keys, assert no crash.
- Frontend unit (vitest): `CitationChip` renders N chips, popover shows snippet.
- Frontend unit: `MessageBubble` renders chips only for assistant + non-empty citations.
- E2E verification (manual for this session): production deploy → log in → generate summary → assert citations visible + rationales visible on score cards. Screenshot.

## Verification step (production)

After deploy:
1. Open production URL, authenticate.
2. Trigger a chat turn → confirm `[n]` chips appear after assistant response when grounded.
3. Navigate to dashboard / mentor summary → confirm Sources section + per-category rationales render.
4. If anything fails, debug against prod logs (Vercel + backend) before claiming done.

## Out of scope / deferred

- Paper viewer modal (chip popover is enough).
- Citation deduplication UX (backend already dedupes).
- Rationale editing / regeneration controls.
- Localization.

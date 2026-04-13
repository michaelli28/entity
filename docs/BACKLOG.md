# ZStar Backlog

Items we've decided are valuable but aren't doing right now. Each item captures enough context that a future session can pick it up cold.

---

## Signal-vector generative marks (Amendment 7 of full redesign spec)

**Status:** deferred
**Origin:** 2026-04-12 multi-agent review of `docs/superpowers/specs/2026-04-12-full-redesign-design.md`
**Problem it solves:** current editorial language (italic serif + purple-blue gradient + aurora + mono eyebrow + hairline grid) is a widely-copied 2024 YC-SaaS template. Tasteful but not unmistakably ZStar. Brand critic called it "premium default."

**The idea:** make each founder's signal vector (8 mentor-session scores) the source of their visual identity. Deterministic seed function `signalsToMark(scores) → { palette, mark, motion }` produces a one-of-one generative mark per founder; used as:

- `/cold-read/[slug]` hero background
- `/api/og?slug=...` share-card image (LinkedIn previews become unique per founder)
- `/dashboard/artifacts/[id]` full-bleed header
- `/dashboard/profile` avatar gradient ring (hue from vector, not fixed)
- `/dashboard` hero backdrop (subtle)

**Why deferred:** amendments 1-6 of the redesign are the must-fix correctness/safety/ask-alignment work. Amendment 7 is a distinctiveness / brand-moat play. Worth doing after the base redesign lands and proves out.

**Estimates (see spec conversation history for breakdown):**
- Minimum (SVG mesh gradient, one renderer, 3 surfaces): ~1.5 days
- Solid (SVG + WebGL shader, OG image route, 5 surfaces, taste tuning): ~3-4 days
- Polished (multiple mark styles, animated entrance, share-card templates): ~1 week

**Pick-up checklist when we come back:**
1. Confirm the scoring pipeline is stable (we're building on that vector).
2. Choose renderer: SVG mesh gradient (cheapest), SVG flow field, or WebGL/OGL shader (best looking, needs SSR guard + SVG fallback for OG).
3. Write `packages/ui/src/generative/signals-to-mark.ts` — pure deterministic fn.
4. Build renderer(s) in `packages/ui/src/generative/`.
5. Add `/api/og` route using `@vercel/og` + Satori.
6. Integrate on cold-read hero first, iterate seed fn until it looks intentional (not "generic AI blob"), then roll out to remaining surfaces.
7. Snapshot tests: same seed → same output.

**Related discussion:** brand critic review in 2026-04-12 session (multi-agent debate on full redesign spec).

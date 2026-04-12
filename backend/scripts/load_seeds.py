# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
import asyncio
import json
from pathlib import Path
from typing import Any

import yaml

from src.db.connection import close_pool, get_connection, init_pool

SEEDS = Path(__file__).parent.parent / "seeds"


async def load_patterns() -> int:
    data: list[dict[str, Any]] = yaml.safe_load(
        (SEEDS / "founder_patterns.yaml").read_text()
    )
    count = 0
    async with get_connection() as conn:
        for p in data:
            await conn.execute(
                """
                INSERT INTO founder_patterns
                    (pattern_key, description, source, confidence_tier,
                     when_it_fails, applies_to_stages, applies_to_categories)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (pattern_key) DO UPDATE SET
                    description = EXCLUDED.description,
                    source = EXCLUDED.source,
                    confidence_tier = EXCLUDED.confidence_tier,
                    when_it_fails = EXCLUDED.when_it_fails,
                    applies_to_stages = EXCLUDED.applies_to_stages,
                    applies_to_categories = EXCLUDED.applies_to_categories
                """,
                p["pattern_key"],
                p["description"],
                p.get("source"),
                p["confidence_tier"],
                p.get("when_it_fails"),
                p.get("applies_to_stages") or ["pre_seed", "seed"],
                p.get("applies_to_categories"),
            )
            count += 1
    return count


async def load_benchmarks() -> int:
    data: list[dict[str, Any]] = yaml.safe_load(
        (SEEDS / "stage_benchmarks.yaml").read_text()
    )
    count = 0
    async with get_connection() as conn:
        for b in data:
            await conn.execute(
                """
                INSERT INTO stage_benchmarks
                    (stage, metric_key, metric_value, category, evidence_notes)
                VALUES ($1, $2, $3::jsonb, $4, $5)
                ON CONFLICT (stage, metric_key, category) DO UPDATE SET
                    metric_value = EXCLUDED.metric_value,
                    evidence_notes = EXCLUDED.evidence_notes
                """,
                b["stage"],
                b["metric_key"],
                json.dumps(b["metric_value"]),
                b.get("category"),
                b.get("evidence_notes"),
            )
            count += 1
    return count


async def main() -> None:
    await init_pool()
    try:
        pn = await load_patterns()
        bn = await load_benchmarks()
        print(f"Loaded {pn} patterns, {bn} benchmarks")
    finally:
        await close_pool()


if __name__ == "__main__":
    asyncio.run(main())

# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
import asyncio
import os
from pathlib import Path
from typing import Any

import yaml

GOLDEN = Path(__file__).parent / "golden"


async def run_one(eval_cfg: dict[str, Any]) -> dict[str, Any]:
    from src.llm.client import SONNET_MODEL, get_client
    from src.llm.prompts import MENTOR_IDENTITY, founder_profile_block

    client = get_client()
    context = eval_cfg["context"]
    founder: dict[str, Any] = {"name": "TestFounder", "what_would_make_10x": None}
    profile: dict[str, Any] = {
        "company_name": context.get("company_name", "TestCo"),
        "stage": context.get("stage", "seed"),
        "one_liner": context.get("one_liner", ""),
    }
    system_prompt = "\n\n".join(
        [MENTOR_IDENTITY, founder_profile_block(founder, profile)]
    )
    response = await client.messages.create(
        model=SONNET_MODEL,
        max_tokens=800,
        temperature=0.7,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"<user_message>{eval_cfg['founder_input']}</user_message>",
            }
        ],
    )
    block = response.content[0]
    text: str = getattr(block, "text", "").lower()

    trait_results: list[dict[str, Any]] = []
    passed_required = True
    for trait in eval_cfg["ideal_response_traits"]:
        passed = True
        if "check_contains" in trait:
            passed = all(s.lower() in text for s in trait["check_contains"])
        elif "check_contains_any" in trait:
            passed = any(s.lower() in text for s in trait["check_contains_any"])
        elif "max_words" in trait:
            passed = len(text.split()) <= trait["max_words"]
        is_required: bool = trait.get("required", True)
        if is_required and not passed:
            passed_required = False
        trait_results.append(
            {"name": trait["name"], "passed": passed, "required": is_required}
        )
    return {
        "name": eval_cfg["name"],
        "passed_required": passed_required,
        "traits": trait_results,
    }


async def main() -> None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("SKIP: ANTHROPIC_API_KEY not set — nothing to run.")
        return
    results: list[dict[str, Any]] = []
    for path in sorted(GOLDEN.glob("*.yaml")):
        cfg: dict[str, Any] = yaml.safe_load(path.read_text())
        results.append(await run_one(cfg))
    required_passed = sum(1 for r in results if r["passed_required"])
    print(f"\n{required_passed}/{len(results)} evals passed required traits")
    for r in results:
        status = "PASS" if r["passed_required"] else "FAIL"
        print(f"  [{status}] {r['name']}")
        for t in r["traits"]:
            icon = "+" if t["passed"] else ("X" if t["required"] else "-")
            print(f"    {icon} {t['name']}")


if __name__ == "__main__":
    asyncio.run(main())

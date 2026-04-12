"""Smoke test: ensure seed_demo module imports without error and transcripts have substance."""
import importlib


def test_seed_demo_module_imports():
    mod = importlib.import_module("scripts.seed_demo")
    assert hasattr(mod, "main")


def test_transcripts_are_substantial():
    mod = importlib.import_module("scripts.seed_demo")
    # Look for a transcript constant; should contain at least one assistant turn >100 chars
    for name in dir(mod):
        val = getattr(mod, name)
        if isinstance(val, list) and val and isinstance(val[0], tuple) and len(val[0]) == 2:
            roles = {r for r, _ in val}
            if "assistant" in roles:
                max_assistant = max(len(c) for r, c in val if r == "assistant")
                assert max_assistant > 100, f"{name}: shortest assistant turn too brief"
                return
    # If no transcript constant found, that's a failure too
    raise AssertionError("no transcript list found in module")

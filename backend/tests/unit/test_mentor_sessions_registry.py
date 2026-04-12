import pytest
from src.llm.mentor_sessions import (
    BY_KEY,
    CORE_BLUEPRINTS,
    KNOWN_SIGNAL_CATEGORIES,
    KNOWN_SIGNAL_KEYS,
    SessionBlueprint,
    SessionKey,
    make_deep_dive_blueprint,
)


def test_session_key_is_strenum() -> None:
    assert SessionKey.BIG_PICTURE == "big_picture"
    assert SessionKey("problem_market") == SessionKey.PROBLEM_MARKET


def test_core_blueprints_are_four_in_order() -> None:
    assert len(CORE_BLUEPRINTS) == 4
    assert [bp.order for bp in CORE_BLUEPRINTS] == [1, 2, 3, 4]


def test_by_key_covers_all_core_plus_deep_dive_factory() -> None:
    keys = {bp.key for bp in CORE_BLUEPRINTS}
    assert keys == {
        SessionKey.BIG_PICTURE,
        SessionKey.PROBLEM_MARKET,
        SessionKey.BUSINESS,
        SessionKey.ASK,
    }


def test_every_blueprint_has_non_empty_prompts_and_targets() -> None:
    for bp in CORE_BLUEPRINTS:
        assert bp.title
        assert bp.subtitle
        assert bp.system_suffix
        assert bp.completion_prompt
        assert len(bp.target_signals) >= 1
        assert len(bp.starter_questions) >= 1


def test_target_signals_are_known() -> None:
    for bp in CORE_BLUEPRINTS:
        for sig in bp.target_signals:
            assert sig in KNOWN_SIGNAL_KEYS, f"{bp.key} has unknown target {sig}"


def test_deep_dive_factory_rejects_unknown_category() -> None:
    with pytest.raises(ValueError, match="target_category"):
        make_deep_dive_blueprint("not-a-real-category", "mrr_or_revenue")


def test_deep_dive_factory_rejects_unknown_signal() -> None:
    with pytest.raises(ValueError, match="target_signal"):
        make_deep_dive_blueprint("traction", "not-a-real-signal")


def test_deep_dive_factory_happy_path() -> None:
    bp = make_deep_dive_blueprint("traction", "mrr_or_revenue")
    assert bp.key == SessionKey.DEEP_DIVE
    assert "traction" in bp.system_suffix.lower()
    assert "mrr_or_revenue" in bp.target_signals
    assert bp.order == 99

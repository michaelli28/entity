from src.core.config import settings


def test_coverage_threshold_default() -> None:
    assert settings.COVERAGE_COMPLETION_THRESHOLD == 75


def test_coverage_min_turns_default() -> None:
    assert settings.COVERAGE_MIN_TURNS == 3

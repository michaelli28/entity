"""Tests for the RagMode enum and fail-fast OpenAI key validation in Settings."""
import pytest

from src.core.config import RagMode, Settings


def _make(**overrides: object) -> Settings:
    """Construct a Settings instance with env loading disabled."""
    base: dict[str, object] = {
        "_env_file": None,  # type: ignore[arg-type]
    }
    base.update(overrides)
    return Settings(**base)  # type: ignore[arg-type]


def test_rag_mode_defaults_to_off() -> None:
    s = _make()
    assert s.rag_mode is RagMode.OFF


def test_rag_mode_off_does_not_require_openai_key() -> None:
    s = _make(rag_mode=RagMode.OFF, openai_api_key="")
    assert s.openai_api_key == ""


def test_rag_mode_mentor_only_requires_openai_key() -> None:
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        _make(rag_mode=RagMode.MENTOR_ONLY, openai_api_key="")


def test_rag_mode_full_requires_openai_key() -> None:
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        _make(rag_mode=RagMode.FULL, openai_api_key="")


def test_rag_mode_full_with_key_passes() -> None:
    s = _make(rag_mode=RagMode.FULL, openai_api_key="sk-test")
    assert s.rag_mode is RagMode.FULL
    assert s.openai_api_key == "sk-test"


def test_rag_mode_enum_values() -> None:
    assert RagMode.OFF.value == "off"
    assert RagMode.MENTOR_ONLY.value == "mentor_only"
    assert RagMode.FULL.value == "full"

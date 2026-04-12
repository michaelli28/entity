from unittest.mock import AsyncMock, patch

import pytest

from src.llm.judges import CoverageResult, judge_session_coverage
from src.llm.mentor_sessions import BIG_PICTURE


@pytest.mark.asyncio
async def test_coverage_result_schema() -> None:
    r = CoverageResult(coverage_score=82, missing=["icp"], rationale="ok")
    assert r.coverage_score == 82
    assert r.missing == ["icp"]


@pytest.mark.asyncio
async def test_coverage_result_rejects_out_of_bounds() -> None:
    with pytest.raises(ValueError):
        CoverageResult(coverage_score=120, missing=[], rationale="")


@pytest.mark.asyncio
@patch("src.llm.judges._get_instructor_client")
async def test_judge_returns_result(mock_client: AsyncMock) -> None:
    mock_instance = AsyncMock()
    mock_instance.messages.create = AsyncMock(
        return_value=CoverageResult(coverage_score=55, missing=["timing"], rationale="vague")
    )
    mock_client.return_value = mock_instance
    transcript = [
        {"role": "user", "content": "I'm a founder"},
        {"role": "assistant", "content": "Tell me more"},
    ]
    result = await judge_session_coverage(BIG_PICTURE, transcript, user_turn_count=1)
    assert result.coverage_score == 55


@pytest.mark.asyncio
@patch("src.llm.judges._get_instructor_client")
async def test_judge_swallows_terminal_failure(mock_client: AsyncMock) -> None:
    mock_instance = AsyncMock()
    mock_instance.messages.create = AsyncMock(side_effect=RuntimeError("rate limit"))
    mock_client.return_value = mock_instance
    result = await judge_session_coverage(BIG_PICTURE, [], user_turn_count=0)
    assert result.coverage_score == 0
    assert result.missing == []

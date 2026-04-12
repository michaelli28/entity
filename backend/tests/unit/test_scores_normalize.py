from src.api.scores import _normalize_category_scores


def test_accepts_dict():
    result = _normalize_category_scores(
        {"founder": 70, "market": 50, "problem": 80}
    )
    assert result["founder"] == 70
    assert result["market"] == 50
    assert result["competition"] == 0  # missing → 0


def test_parses_json_string():
    result = _normalize_category_scores('{"founder": 65}')
    assert result["founder"] == 65


def test_clamps_out_of_bounds():
    result = _normalize_category_scores({"founder": 150, "market": -20})
    assert result["founder"] == 100
    assert result["market"] == 0


def test_handles_garbage():
    assert _normalize_category_scores(None)["founder"] == 0
    assert _normalize_category_scores("not json")["founder"] == 0

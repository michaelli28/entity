from typing import get_args

from src.core.categories import CATEGORIES, CategoryKey


def test_categories_tuple_has_eight_entries() -> None:
    assert len(CATEGORIES) == 8


def test_every_tuple_entry_is_a_valid_category_key() -> None:
    valid = set(get_args(CategoryKey))
    assert set(CATEGORIES) == valid


def test_categories_are_unique() -> None:
    assert len(set(CATEGORIES)) == len(CATEGORIES)


def test_categories_exact_membership() -> None:
    expected = {
        "founder",
        "market",
        "problem",
        "competition",
        "product",
        "traction",
        "pricing",
        "team",
    }
    assert set(CATEGORIES) == expected

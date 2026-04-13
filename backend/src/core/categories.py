"""Shared rubric categories used by scoring and RAG query mapping.

Keeping the tuple and the Literal in one place lets pyright catch drift
between the scoring API and any downstream consumer.
"""
from typing import Literal

CategoryKey = Literal[
    "founder",
    "market",
    "problem",
    "competition",
    "product",
    "traction",
    "pricing",
    "team",
]

CATEGORIES: tuple[CategoryKey, ...] = (
    "founder",
    "market",
    "problem",
    "competition",
    "product",
    "traction",
    "pricing",
    "team",
)

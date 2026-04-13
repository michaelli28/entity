"""PDF parsing with section detection and PII scrub.

Uses pypdf (BSD-3) — explicitly NOT pymupdf (AGPL).

Sections are detected by matching a small set of canonical academic headings
on their own line. When no heading is detected, the whole document is
returned as a single unheaded section.

PII scrub: email addresses are stripped line-by-line before returning content.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

_EMAIL_RE = re.compile(r"\S+@\S+\.\S+")

# Canonical section names commonly found in academic papers, in lowercase.
_HEADINGS: tuple[str, ...] = (
    "abstract",
    "introduction",
    "background",
    "related work",
    "method",
    "methods",
    "methodology",
    "results",
    "findings",
    "discussion",
    "conclusion",
    "conclusions",
    "references",
)

# A line qualifies as a heading if it is just the heading word(s), optionally
# prefixed by a numeric label like "1." or "IV.".
_HEADING_RE = re.compile(
    r"^\s*(?:[IVX\d]+\.?\s+)?(" + "|".join(_HEADINGS) + r")\s*:?\s*$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Section:
    heading: str | None
    content: str


def _read_text(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def _scrub_line(line: str) -> str | None:
    """Drop entire lines containing email addresses (author / affiliation PII)."""
    if _EMAIL_RE.search(line):
        return None
    return line


def _normalize(lines: list[str]) -> list[str]:
    out: list[str] = []
    for raw in lines:
        scrubbed = _scrub_line(raw)
        if scrubbed is None:
            continue
        stripped = scrubbed.strip()
        if stripped:
            out.append(stripped)
    return out


def _split_into_sections(lines: list[str]) -> list[Section]:
    sections: list[Section] = []
    current_heading: str | None = None
    buffer: list[str] = []

    def flush() -> None:
        if buffer:
            sections.append(
                Section(heading=current_heading, content=" ".join(buffer).strip())
            )

    for line in lines:
        m = _HEADING_RE.match(line)
        if m:
            flush()
            current_heading = m.group(1).lower()
            buffer = []
            continue
        buffer.append(line)

    flush()
    return sections


def parse_pdf(path: Path | str) -> list[Section]:
    text = _read_text(Path(path))
    lines = _normalize(text.splitlines())

    sections = _split_into_sections(lines)

    # Drop sections that are purely headings with no body.
    sections = [s for s in sections if s.content]

    # If no headings were detected at all, fall back to a single section.
    if not any(s.heading for s in sections):
        combined = " ".join(s.content for s in sections)
        return [Section(heading=None, content=combined)] if combined else []

    return sections

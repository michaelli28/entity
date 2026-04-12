import re
from pathlib import Path

import sqlglot
from sqlglot import expressions as exp

REPO_ROOT = Path(__file__).resolve().parents[2]
REPOS_DIR = REPO_ROOT / "src" / "db" / "repositories"

FOUNDER_OWNED_TABLES = {
    "founders",
    "startup_profiles",
    "mentor_sessions",
    "mentor_messages",
    "session_signals",
    "signal_scores",
    "founder_memory",
    "cold_reads",
    "mentor_session_summaries",
    "founder_commitments",
    "intro_requests",
}

SAFE_COLUMNS = {"founder_id", "clerk_user_id", "id"}

SQL_STRING_RE = re.compile(r'"""(.*?)"""', re.DOTALL)


def _extract_sql_strings(text: str) -> list[str]:
    return [
        m.strip()
        for m in SQL_STRING_RE.findall(text)
        if m.strip().lower().startswith(("select", "insert", "update", "delete"))
    ]


def _references_founder_table(sql: str) -> bool:
    try:
        parsed = sqlglot.parse_one(sql, read="postgres")
    except Exception:
        return False
    tables = {t.name.lower() for t in parsed.find_all(exp.Table)}
    return bool(tables & FOUNDER_OWNED_TABLES)


def _has_safe_predicate(sql: str) -> bool:
    lowered = sql.lower()
    return any(
        col in lowered and ("=" in lowered or "in (" in lowered)
        for col in SAFE_COLUMNS
    )


def test_all_founder_table_queries_have_tenant_filter() -> None:
    offenders: list[tuple[str, str]] = []
    for py_file in REPOS_DIR.rglob("*.py"):
        text = py_file.read_text()
        for sql in _extract_sql_strings(text):
            if not _references_founder_table(sql):
                continue
            if sql.lower().startswith("insert"):
                continue  # inserts set founder_id in VALUES
            if not _has_safe_predicate(sql):
                offenders.append((py_file.name, sql[:100]))
    assert not offenders, f"Queries without tenant filter: {offenders}"

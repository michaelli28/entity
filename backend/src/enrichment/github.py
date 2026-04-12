"""GitHub public-data enrichment. No auth required for public endpoints."""
from datetime import UTC, datetime
from typing import Any

import httpx
import structlog

log = structlog.get_logger()

GITHUB_API = "https://api.github.com"


async def fetch_github_profile(username: str) -> dict[str, Any] | None:
    """Fetch public GitHub profile + top repos. Returns None on any failure."""
    if not username or not username.strip():
        return None
    username = username.strip().lstrip("@")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "zstar-mentor",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            user_r = await client.get(f"{GITHUB_API}/users/{username}")
            if user_r.status_code != 200:
                log.info(
                    "github_user_fetch_failed",
                    username=username,
                    status=user_r.status_code,
                )
                return None
            user = user_r.json()
            repos_r = await client.get(
                f"{GITHUB_API}/users/{username}/repos",
                params={"sort": "updated", "per_page": 10, "type": "owner"},
            )
            repos_raw = repos_r.json() if repos_r.status_code == 200 else []
    except Exception:
        log.exception("github_fetch_exception", username=username)
        return None

    top_repos = [
        {
            "name": r.get("name"),
            "description": r.get("description"),
            "language": r.get("language"),
            "stars": r.get("stargazers_count"),
            "forks": r.get("forks_count"),
            "updated_at": r.get("updated_at"),
            "html_url": r.get("html_url"),
        }
        for r in (repos_raw if isinstance(repos_raw, list) else [])
        if not r.get("fork")
    ][:5]

    return {
        "login": user.get("login"),
        "name": user.get("name"),
        "bio": user.get("bio"),
        "company": user.get("company"),
        "location": user.get("location"),
        "blog": user.get("blog"),
        "public_repos": user.get("public_repos"),
        "followers": user.get("followers"),
        "following": user.get("following"),
        "created_at": user.get("created_at"),
        "avatar_url": user.get("avatar_url"),
        "html_url": user.get("html_url"),
        "top_repos": top_repos,
        "fetched_at": datetime.now(UTC).isoformat(),
    }

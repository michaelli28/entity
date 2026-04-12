# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from . import (
    purge_deleted_founders,
    send_reengagement_emails,
    send_welcome_emails,
)

_scheduler: AsyncIOScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        send_welcome_emails.run,
        "interval",
        minutes=5,
        id="welcome_emails",
    )
    _scheduler.add_job(
        send_reengagement_emails.run,
        "interval",
        hours=1,
        id="reengagement",
    )
    _scheduler.add_job(
        purge_deleted_founders.run,
        "cron",
        hour=3,
        id="purge",
    )
    _scheduler.start()


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown()
        _scheduler = None

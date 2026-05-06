from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

from sqlalchemy.orm import Session

from app.services.google_oauth import get_valid_google_access_token, google_api_get


def list_courses(db: Session, *, user_id: int) -> list[dict[str, Any]]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    data = google_api_get(
        f"https://classroom.googleapis.com/v1/courses?{urlencode({'courseStates': 'ACTIVE'})}",
        access_token=access_token,
    )
    return list(data.get("courses") or [])


def list_pending_coursework(db: Session, *, user_id: int, max_items: int = 50) -> list[dict[str, Any]]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    courses = list_courses(db, user_id=user_id)
    if not courses:
        return []

    pending: list[dict[str, Any]] = []
    permission_errors = 0
    for c in courses:
        course_id = str(c.get("id") or "")
        course_name = str(c.get("name") or "Course")
        if not course_id:
            continue

        q = urlencode({"pageSize": "50", "orderBy": "dueDate desc"})
        try:
            work = google_api_get(
                f"https://classroom.googleapis.com/v1/courses/{course_id}/courseWork?{q}",
                access_token=access_token,
            )
        except ValueError as exc:
            message = str(exc).lower()
            if "google api 403" in message and (
                "does not have permission" in message
                or "insufficient" in message
                or "forbidden" in message
            ):
                permission_errors += 1
                # Skip this course and keep trying others.
                continue
            raise
        items = work.get("courseWork") or []

        for cw in items:
            due_date = cw.get("dueDate") or None
            due_time = cw.get("dueTime") or None
            if not due_date:
                continue

            year = int(due_date.get("year", 0) or 0)
            month = int(due_date.get("month", 0) or 0)
            day = int(due_date.get("day", 0) or 0)
            hour = int((due_time or {}).get("hours", 23) or 23)
            minute = int((due_time or {}).get("minutes", 59) or 59)

            try:
                due_dt = datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
            except Exception:
                continue

            # Heuristic priority
            delta_days = (due_dt - datetime.now(timezone.utc)).total_seconds() / 86400
            priority = "high" if delta_days <= 2 else "medium" if delta_days <= 7 else "low"

            pending.append(
                {
                    "id": str(cw.get("id") or ""),
                    "course": course_name,
                    "title": str(cw.get("title") or "Coursework"),
                    "description": str(cw.get("description") or ""),
                    "due_at": due_dt.isoformat(),
                    "priority": priority,
                    "progress": 0,
                }
            )

            if len(pending) >= max_items:
                return pending

    # soonest first
    pending.sort(key=lambda x: x.get("due_at") or "")
    if permission_errors > 0 and not pending:
        raise ValueError(
            "Classroom access denied for this account. Re-login with Google to re-consent Classroom scopes, "
            "and verify your school/admin allows Classroom API access for third-party apps."
        )
    return pending


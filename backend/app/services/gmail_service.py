from __future__ import annotations

from datetime import datetime
from typing import Any
from urllib.parse import urlencode

from sqlalchemy.orm import Session

from app.services.google_oauth import get_valid_google_access_token, google_api_get, google_api_post_json


def _header(headers: list[dict[str, Any]], name: str) -> str:
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return str(h.get("value") or "")
    return ""


def list_emails(db: Session, *, user_id: int, max_results: int = 20) -> list[dict[str, Any]]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    q = urlencode({"maxResults": str(max_results)})
    index = google_api_get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages?{q}", access_token=access_token)
    messages = index.get("messages") or []

    out: list[dict[str, Any]] = []
    for m in messages:
        msg_id = str(m.get("id") or "")
        if not msg_id:
            continue

        meta_q = urlencode(
            {
                "format": "metadata",
                "metadataHeaders": ["From", "Subject", "Date"],
            },
            doseq=True,
        )
        detail = google_api_get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?{meta_q}",
            access_token=access_token,
        )
        payload = detail.get("payload") or {}
        headers = payload.get("headers") or []
        label_ids = set(detail.get("labelIds") or [])

        from_raw = _header(headers, "From")
        subject = _header(headers, "Subject") or "(no subject)"
        date_raw = _header(headers, "Date")
        snippet = str(detail.get("snippet") or "")

        # Simple UI-friendly time; Gmail Date is RFC2822
        time_display = date_raw
        try:
            dt = datetime.strptime(date_raw[:25], "%a, %d %b %Y %H:%M:%S")
            time_display = dt.strftime("%I:%M %p")
        except Exception:
            pass

        out.append(
            {
                "id": msg_id,
                "from": from_raw or "Unknown",
                "subject": subject,
                "preview": snippet,
                "time": time_display or "",
                "read": "UNREAD" not in label_ids,
                "starred": "STARRED" in label_ids,
                "aiSummary": snippet[:180] + ("..." if len(snippet) > 180 else ""),
            }
        )
    return out


def set_star(db: Session, *, user_id: int, message_id: str, starred: bool) -> None:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    payload: dict[str, Any] = {"addLabelIds": [], "removeLabelIds": []}
    if starred:
        payload["addLabelIds"].append("STARRED")
    else:
        payload["removeLabelIds"].append("STARRED")
    google_api_post_json(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        access_token=access_token,
        payload=payload,
    )


def mark_read(db: Session, *, user_id: int, message_id: str, read: bool) -> None:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    payload: dict[str, Any] = {"addLabelIds": [], "removeLabelIds": []}
    if read:
        payload["removeLabelIds"].append("UNREAD")
    else:
        payload["addLabelIds"].append("UNREAD")
    google_api_post_json(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        access_token=access_token,
        payload=payload,
    )


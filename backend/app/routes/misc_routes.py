import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database.session import get_db
from app.models.entities import User
from app.schemas.dto import AssistantMessageIn
from app.services.google_calendar_service import create_event, list_events
from app.services.gmail_service import list_emails, mark_read, set_star
from app.services.jobs_service import fetch_jobs
from app.services.news_service import fetch_news
from app.services.openai_service import ask_openai
from app.utils.deps import get_current_user

router = APIRouter(tags=["misc"])


@router.get("/jobs")
def jobs(q: str = "", location: str = "", type: str = "", _user: User = Depends(get_current_user)):
    return fetch_jobs(q=q, location=location, job_type=type)


@router.post("/assistant/availability/chat")
def availability_chat(payload: AssistantMessageIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    horizon = now + timedelta(days=14)
    events_context = []
    try:
        events = list_events(db, user_id=user.id, from_at=now, to_at=horizon)
        for e in events[:40]:
            start = (e.get("start") or {}).get("dateTime") or (e.get("start") or {}).get("date")
            end = (e.get("end") or {}).get("dateTime") or (e.get("end") or {}).get("date")
            events_context.append(
                {
                    "title": str(e.get("summary") or "Event"),
                    "start": start,
                    "end": end,
                    "location": str(e.get("location") or ""),
                }
            )
    except Exception:
        events_context = []

    extraction_prompt = (
        "You are a scheduler parser. Return strict JSON only with keys: "
        "intent (one of 'create_event','query','other'), "
        "title (string), start_at (ISO datetime or ''), end_at (ISO datetime or ''), "
        "location (string), notes (string). "
        "If user asks to schedule/create/add, intent='create_event'. "
        "If date/time missing, keep empty fields."
    )
    try:
        parsed_raw = ask_openai(
            f"Now: {now.isoformat()}\nUser message: {payload.message}",
            extraction_prompt,
        )
        parsed = json.loads(parsed_raw)
    except Exception:
        parsed = {"intent": "query", "title": "", "start_at": "", "end_at": "", "location": "", "notes": ""}

    created = None
    if (
        parsed.get("intent") == "create_event"
        and parsed.get("start_at")
        and parsed.get("end_at")
        and parsed.get("title")
    ):
        try:
            start_at = datetime.fromisoformat(str(parsed["start_at"]).replace("Z", "+00:00"))
            end_at = datetime.fromisoformat(str(parsed["end_at"]).replace("Z", "+00:00"))
            created = create_event(
                db,
                user_id=user.id,
                title=str(parsed["title"]),
                start_at=start_at,
                end_at=end_at,
                location=str(parsed.get("location") or ""),
            )
        except Exception:
            created = None

    try:
        reply = ask_openai(
            (
                "You are an academic scheduling assistant. Use the user's real calendar context. "
                "If a create request was fulfilled, confirm it clearly. "
                "If info is missing for scheduling, ask concise follow-up.\n\n"
                f"User message:\n{payload.message}\n\n"
                f"Upcoming events JSON:\n{json.dumps(events_context, ensure_ascii=True)}\n\n"
                f"Parsed intent JSON:\n{json.dumps(parsed, ensure_ascii=True)}\n\n"
                f"Created event JSON (null if not created):\n{json.dumps(created, ensure_ascii=True)}"
            ),
            "Keep responses practical, concise, and specific to the given calendar data.",
        )
    except Exception:
        if created:
            reply = "Done — I created that event in your Google Calendar."
        elif parsed.get("intent") == "create_event":
            reply = "I can create that event, but I still need exact start and end time."
        else:
            reply = "I checked your calendar context and can help plan around your upcoming events."
    return {"reply": reply}


@router.get("/news")
def news(category: str = "All", _user: User = Depends(get_current_user)):
    return fetch_news(category=category)


@router.get("/emails")
def emails(db=Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return list_emails(db, user_id=user.id, max_results=25)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class EmailStarIn(BaseModel):
    starred: bool


@router.post("/emails/{message_id}/star")
def email_star(message_id: str, payload: EmailStarIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    set_star(db, user_id=user.id, message_id=message_id, starred=payload.starred)
    return {"ok": True}


class EmailReadIn(BaseModel):
    read: bool


@router.post("/emails/{message_id}/mark-read")
def email_mark_read(message_id: str, payload: EmailReadIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    mark_read(db, user_id=user.id, message_id=message_id, read=payload.read)
    return {"ok": True}


class EmailDraftIn(BaseModel):
    prompt: str = ""


@router.post("/emails/{message_id}/draft-reply")
def email_draft_reply(message_id: str, payload: EmailDraftIn, _user: User = Depends(get_current_user)):
    try:
        reply = ask_openai(
            payload.prompt or f"Draft a polite reply to email {message_id}.",
            "You are an email assistant. Draft concise, professional replies.",
        )
    except Exception:
        reply = "Draft: Thanks for the update. I will follow up shortly."
    return {"draft": reply}


@router.get("/settings")
def settings_data(user: User = Depends(get_current_user)):
    return {
        "username": user.name,
        "email": user.email,
        "notifications": {"emailNotifications": True, "pushNotifications": True, "taskReminders": True, "meetingReminders": True, "newsDigest": False},
    }


@router.put("/settings")
def save_settings(payload: dict, _user: User = Depends(get_current_user)):
    return {"message": "Settings saved", "data": payload}

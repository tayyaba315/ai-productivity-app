import express from "express";
import { getAccountAndAccessToken, getRequestedUserEmail } from "../services/googleService.js";

const router = express.Router();

const scheduleStore = [];

const isoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

router.get("/events", (req, res) => {
  const handler = async () => {
  const fromAt = isoOrNull(req.query.from_at);
  const toAt = isoOrNull(req.query.to_at);

  if (!fromAt || !toAt) {
    return res.status(400).json({ detail: "from_at and to_at are required ISO datetimes" });
  }

  const fromTs = new Date(fromAt).getTime();
  const toTs = new Date(toAt).getTime();
  let events = scheduleStore.filter((item) => {
      const startTs = new Date(item.start_at).getTime();
      return startTs >= fromTs && startTs <= toTs;
    });

    const userEmail = getRequestedUserEmail(req);
    if (userEmail) {
      try {
        const { accessToken } = await getAccountAndAccessToken(userEmail);
        const params = new URLSearchParams({
          timeMin: fromAt,
          timeMax: toAt,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "250",
        });
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        if (response.ok) {
          events = Array.isArray(data.items) ? data.items : [];
        }
      } catch (_err) {
        // Fall back to local schedule store for non-connected users.
      }
    }

    return res.json({ events });
  };
  handler().catch((err) => res.status(400).json({ detail: String(err.message || err) }));
});

router.post("/sync", (req, res) => {
  const fromAt = isoOrNull(req.query.from_at);
  const toAt = isoOrNull(req.query.to_at);
  if (!fromAt || !toAt) {
    return res.status(400).json({ detail: "from_at and to_at are required ISO datetimes" });
  }
  return res.json({ synced: 0 });
});

router.post("/events", (req, res) => {
  const handler = async () => {
  const title = String(req.body?.title || "").trim();
  const startAt = isoOrNull(req.body?.start_at);
  const endAt = isoOrNull(req.body?.end_at);
  const location = String(req.body?.location || "");
  const alsoCreateGoogle = req.body?.also_create_google !== false;

  if (!title || !startAt || !endAt) {
    return res.status(400).json({ detail: "title, start_at and end_at are required" });
  }

  const schedule = {
    id: String(Date.now()),
    title,
    category: "meeting",
    start_at: startAt,
    end_at: endAt,
    location,
  };
  scheduleStore.push(schedule);

  let googleEvent = null;
  if (alsoCreateGoogle) {
    const userEmail = getRequestedUserEmail(req);
    if (userEmail) {
      try {
        const { accessToken } = await getAccountAndAccessToken(userEmail);
        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: title,
            location,
            start: { dateTime: startAt, timeZone: "UTC" },
            end: { dateTime: endAt, timeZone: "UTC" },
          }),
        });
        const data = await response.json();
        if (response.ok) {
          googleEvent = data;
        }
      } catch (_err) {
        googleEvent = null;
      }
    } else {
      googleEvent = {
        id: `g-${schedule.id}`,
        summary: title,
        location,
        start: { dateTime: startAt },
        end: { dateTime: endAt },
      };
    }
  }

    return res.json({ schedule, google_event: googleEvent });
  };
  handler().catch((err) => res.status(400).json({ detail: String(err.message || err) }));
});

export default router;

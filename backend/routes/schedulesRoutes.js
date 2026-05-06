import express from "express";

const router = express.Router();

let nextScheduleId = 2;
const schedulesStore = [
  {
    id: 1,
    title: "CS Team Meeting",
    category: "meeting",
    start_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    end_at: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    location: "Lab 2",
  },
];

const toDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

router.post("/", (req, res) => {
  const startDate = toDate(req.body?.start_at);
  const endDate = toDate(req.body?.end_at);
  if (!startDate || !endDate || endDate <= startDate) {
    return res.status(400).json({ detail: "Invalid start_at or end_at" });
  }

  const hasConflict = schedulesStore.some((item) => {
    const existingStart = toDate(item.start_at);
    const existingEnd = toDate(item.end_at);
    return existingStart && existingEnd && existingStart < endDate && existingEnd > startDate;
  });
  if (hasConflict) {
    return res.status(409).json({ detail: "Schedule conflict detected" });
  }

  const row = {
    id: nextScheduleId++,
    title: String(req.body?.title || "Untitled"),
    category: String(req.body?.category || "general"),
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    location: String(req.body?.location || ""),
  };
  schedulesStore.push(row);
  return res.json(row);
});

router.get("/", (_req, res) => {
  return res.json(schedulesStore);
});

router.get("/available-slots", (req, res) => {
  const fromAt = toDate(req.query.from_at);
  const toAt = toDate(req.query.to_at);
  const durationMinutes = Number(req.query.duration_minutes || 60);

  if (!fromAt || !toAt || toAt <= fromAt || durationMinutes <= 0) {
    return res.status(400).json({ detail: "Invalid range or duration_minutes" });
  }

  const durationMs = durationMinutes * 60 * 1000;
  const events = schedulesStore
    .map((item) => ({ ...item, startDate: toDate(item.start_at), endDate: toDate(item.end_at) }))
    .filter((item) => item.startDate && item.endDate && item.startDate >= fromAt && item.endDate <= toAt)
    .sort((a, b) => a.startDate - b.startDate);

  const slots = [];
  let pointer = fromAt.getTime();
  events.forEach((event) => {
    const eventStart = event.startDate.getTime();
    const eventEnd = event.endDate.getTime();
    if (eventStart - pointer >= durationMs) {
      slots.push({
        start_at: new Date(pointer).toISOString(),
        end_at: new Date(pointer + durationMs).toISOString(),
      });
    }
    pointer = Math.max(pointer, eventEnd);
  });

  if (toAt.getTime() - pointer >= durationMs) {
    slots.push({
      start_at: new Date(pointer).toISOString(),
      end_at: new Date(pointer + durationMs).toISOString(),
    });
  }

  return res.json({ slots });
});

export default router;

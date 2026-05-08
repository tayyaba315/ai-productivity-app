import express from "express";
import { getAccountAndAccessToken, getRequestedUserEmail } from "../services/googleService.js";
import Task from "../models/Task.js";

const router = express.Router();

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (_err) {
    return {};
  }
};

const toDueIso = (cw) => {
  const dd = cw?.dueDate || null;
  if (!dd?.year || !dd?.month || !dd?.day) return null;
  const hours = cw?.dueTime?.hours ?? 23;
  const minutes = cw?.dueTime?.minutes ?? 59;
  const due = new Date(Date.UTC(dd.year, dd.month - 1, dd.day, hours, minutes, 0));
  return Number.isNaN(due.getTime()) ? null : due.toISOString();
};

router.get("/pending-work", (req, res) => {
  const handler = async () => {
    const userEmail = getRequestedUserEmail(req);
    if (!userEmail) {
      return res.status(400).json({ connected: false, items: [], detail: "Missing user email" });
    }

    try {
      const { accessToken } = await getAccountAndAccessToken(userEmail);
      const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const coursesData = await parseJsonSafe(coursesRes);
      if (!coursesRes.ok || !Array.isArray(coursesData.courses)) {
        return res.json({ connected: true, items: [] });
      }

      const pending = [];
      for (const course of coursesData.courses) {
        const courseId = String(course.id || "");
        if (!courseId) continue;
        const courseworkRes = await fetch(
          `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?pageSize=50&orderBy=dueDate%20desc`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const courseworkData = await parseJsonSafe(courseworkRes);
        if (!courseworkRes.ok || !Array.isArray(courseworkData.courseWork)) {
          continue;
        }

        // Only show work that is actually pending for the current student ("me").
        for (const cw of courseworkData.courseWork) {
          const cwId = String(cw?.id || "");
          if (!cwId) continue;

          const dueIso = toDueIso(cw);
          if (!dueIso) continue;

          const subRes = await fetch(
            `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${cwId}/studentSubmissions?userId=me`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const subData = await parseJsonSafe(subRes);
          if (!subRes.ok || !Array.isArray(subData.studentSubmissions) || !subData.studentSubmissions.length) {
            continue;
          }
          const sub = subData.studentSubmissions[0];
          const state = String(sub?.state || "").toUpperCase();
          if (state === "TURNED_IN" || state === "RETURNED") continue;

          pending.push({
            id: cwId,
            course: String(course.name || "Course"),
            title: String(cw.title || "Coursework"),
            dueDate: dueIso,
            status: "pending",
          });
        }
      }

      pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      // Merge stored progress from MongoDB (for Classroom items).
      const ids = pending.map((p) => String(p.id)).filter(Boolean);
      const stored = ids.length
        ? await Task.find({ userEmail, externalSource: "classroom", externalId: { $in: ids } })
        : [];
      const byExternalId = new Map(stored.map((t) => [String(t.externalId || ""), t]));
      const merged = pending.map((p) => {
        const t = byExternalId.get(String(p.id)) || null;
        if (!t) return p;
        const progress = Number(t.progress || 0);
        return {
          ...p,
          status: t.completed || progress >= 100 ? "completed" : p.status,
          progress,
        };
      });

      return res.json({ connected: true, items: merged });
    } catch (_err) {
      return res.json({ connected: false, items: [], detail: "Google not connected" });
    }
  };
  handler().catch(() => res.status(500).json({ connected: false, items: [], detail: "Failed to load classroom work" }));
});

router.post("/progress", (req, res) => {
  const handler = async () => {
    const userEmail = getRequestedUserEmail(req);
    if (!userEmail) {
      return res.status(400).json({ detail: "Missing user email" });
    }
    const externalId = String(req.body?.coursework_id || req.body?.id || "").trim();
    const title = String(req.body?.title || "Classroom coursework").trim();
    const dueDate = String(req.body?.due_date || req.body?.dueDate || "").trim();
    const progress = Math.max(0, Math.min(100, Number(req.body?.progress ?? 0)));
    const completed = Boolean(req.body?.completed ?? progress >= 100);

    if (!externalId) return res.status(400).json({ detail: "coursework_id is required" });
    if (!dueDate) return res.status(400).json({ detail: "due_date is required" });

    const updated = await Task.findOneAndUpdate(
      { userEmail, externalSource: "classroom", externalId },
      {
        $set: {
          userEmail,
          externalSource: "classroom",
          externalId,
          title,
          due_date: new Date(dueDate),
          progress,
          completed,
          description: "Google Classroom coursework",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, task: { ...updated.toObject(), id: updated._id } });
  };

  handler().catch((err) => res.status(400).json({ detail: String(err.message || err) }));
});

export default router;

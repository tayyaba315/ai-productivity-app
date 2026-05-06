import express from "express";
import { getAccountAndAccessToken, getRequestedUserEmail } from "../services/googleService.js";

const router = express.Router();

router.get("/pending-work", (req, res) => {
  const fallbackItems = [
    {
      id: "cw-1",
      course: "Machine Learning",
      title: "Linear Regression Assignment",
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      status: "pending",
    },
    {
      id: "cw-2",
      course: "Software Engineering",
      title: "Architecture Review Notes",
      dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
      status: "pending",
    },
  ];

  const handler = async () => {
    const userEmail = getRequestedUserEmail(req);
    if (!userEmail) {
      return res.json({ items: fallbackItems });
    }

    try {
      const { accessToken } = await getAccountAndAccessToken(userEmail);
      const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const coursesData = await coursesRes.json();
      if (!coursesRes.ok || !Array.isArray(coursesData.courses)) {
        return res.json({ items: fallbackItems });
      }

      const pending = [];
      for (const course of coursesData.courses) {
        const courseId = String(course.id || "");
        if (!courseId) continue;
        const courseworkRes = await fetch(
          `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?pageSize=50&orderBy=dueDate%20desc`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const courseworkData = await courseworkRes.json();
        if (!courseworkRes.ok || !Array.isArray(courseworkData.courseWork)) {
          continue;
        }
        courseworkData.courseWork.forEach((cw) => {
          const dd = cw.dueDate || null;
          if (!dd?.year || !dd?.month || !dd?.day) return;
          const due = new Date(Date.UTC(dd.year, dd.month - 1, dd.day, cw.dueTime?.hours || 23, cw.dueTime?.minutes || 59));
          pending.push({
            id: String(cw.id || ""),
            course: String(course.name || "Course"),
            title: String(cw.title || "Coursework"),
            dueDate: due.toISOString(),
            status: "pending",
          });
        });
      }

      pending.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      return res.json({ items: pending.length ? pending : fallbackItems });
    } catch (_err) {
      return res.json({ items: fallbackItems });
    }
  };
  handler().catch(() => res.json({ items: fallbackItems }));
});

export default router;

import express from "express";
import { getAccountAndAccessToken, getRequestedUserEmail } from "../services/googleService.js";

const router = express.Router();

router.get("/summary", (req, res) => {
  const fallback = () => {
    const today = new Date();
    const month = today.toLocaleDateString(undefined, { month: "short" });
    const day = today.getDate();
    return {
      metrics: {
        emailsToday: 0,
        pendingAssignments: 0,
        scheduledMeetings: 0,
        productivityScore: 72,
      },
      todayTasks: [
        { title: "Connect Google to load live Gmail, Calendar and Classroom data", time: "Anytime", priority: "high" },
      ],
      upcomingDeadlines: [
        { title: "No classroom deadlines synced yet", due: `${month} ${day}`, subject: "Google Classroom", progress: 0 },
      ],
      aiSuggestions: [
        "Your dashboard is live. Connect Google from Settings to show real-time stats.",
      ],
    };
  };

  const handler = async () => {
    const userEmail = getRequestedUserEmail(req);
    if (!userEmail) return res.json(fallback());

    try {
      const { accessToken } = await getAccountAndAccessToken(userEmail);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [gmailRes, calendarRes, coursesRes] = await Promise.all([
        fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=newer_than:1d", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
            startOfDay.toISOString()
          )}&singleEvents=true&orderBy=startTime&maxResults=20`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ),
        fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=20", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const gmail = gmailRes.ok ? await gmailRes.json() : {};
      const calendar = calendarRes.ok ? await calendarRes.json() : {};
      const courses = coursesRes.ok ? await coursesRes.json() : {};

      const emailCount = Array.isArray(gmail.messages) ? gmail.messages.length : 0;
      const meetings = Array.isArray(calendar.items) ? calendar.items : [];
      const coursesList = Array.isArray(courses.courses) ? courses.courses : [];

      const todayTasks = meetings.slice(0, 3).map((item) => ({
        title: String(item.summary || "Scheduled event"),
        time: item.start?.dateTime ? new Date(item.start.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "All day",
        priority: "medium",
      }));

      const upcomingDeadlines = coursesList.slice(0, 3).map((course, index) => ({
        title: `Coursework check-in: ${String(course.name || "Classroom")}`,
        due: `+${index + 1} day`,
        subject: "Google Classroom",
        progress: Math.max(20, 80 - index * 20),
      }));

      const productivityScore = Math.min(100, 60 + Math.round((emailCount + meetings.length + coursesList.length) / 2));

      return res.json({
        metrics: {
          emailsToday: emailCount,
          pendingAssignments: coursesList.length,
          scheduledMeetings: meetings.length,
          productivityScore,
        },
        todayTasks: todayTasks.length ? todayTasks : fallback().todayTasks,
        upcomingDeadlines: upcomingDeadlines.length ? upcomingDeadlines : fallback().upcomingDeadlines,
        aiSuggestions: [
          emailCount > 0 ? `You have ${emailCount} recent emails to triage.` : "No new emails today.",
          meetings.length > 0 ? `You have ${meetings.length} upcoming calendar events.` : "No meetings found for today.",
          coursesList.length > 0 ? `Classroom has ${coursesList.length} active courses.` : "No active Google Classroom courses detected.",
        ],
      });
    } catch (_err) {
      return res.json(fallback());
    }
  };

  handler().catch(() => res.json(fallback()));
});

export default router;

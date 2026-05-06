import express from "express";

const router = express.Router();

let settingsStore = {
  username: "Student",
  email: "student@example.com",
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    meetingReminders: true,
    newsDigest: false,
  },
};

router.get("/", (_req, res) => {
  return res.json(settingsStore);
});

router.put("/", (req, res) => {
  const payload = req.body || {};
  settingsStore = { ...settingsStore, ...payload };
  return res.json({ message: "Settings saved", data: payload });
});

export default router;

import express from "express";
import Setting from "../models/Setting.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { getRequestedUserEmail } from "../services/googleService.js";

const router = express.Router();

const defaultSettings = {
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

router.get("/", async (req, res) => {
  const userEmail = getRequestedUserEmail(req);
  if (!userEmail) return res.status(401).json({ detail: "Unauthorized" });

  let settings = await Setting.findOne({ userEmail });
  const user = await User.findOne({ email: userEmail });

  if (!settings) {
    settings = await Setting.create({ ...defaultSettings, userEmail, email: userEmail, username: user?.name || "Student" });
  } else if (user && settings.username !== user.name) {
    settings.username = user.name;
    await settings.save();
  }
  
  return res.json(settings);
});

router.put("/", async (req, res) => {
  const userEmail = getRequestedUserEmail(req);
  if (!userEmail) return res.status(401).json({ detail: "Unauthorized" });
  
  const payload = req.body || {};
  
  try {
    const user = await User.findOne({ email: userEmail });
    if (user) {
      if (payload.username) {
        user.name = payload.username;
      }
      if (payload.currentPassword && payload.newPassword) {
        const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ detail: "Incorrect current password." });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(payload.newPassword, salt);
      }
      await user.save();
    }
    
    // Clean up passwords before saving to Setting collection
    delete payload.currentPassword;
    delete payload.newPassword;
    delete payload.confirmPassword;

    await Setting.findOneAndUpdate(
      { userEmail },
      { $set: { ...payload, userEmail } },
      { upsert: true, new: true }
    );
    return res.json({ message: "Settings saved", data: payload });
  } catch (err) {
    console.error("Settings save error:", err);
    return res.status(500).json({ detail: "Failed to save settings." });
  }
});

export default router;

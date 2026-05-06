import express from "express";

const router = express.Router();

const defaultReply = "I checked your calendar context and can help plan around your upcoming events.";

router.post("/availability/chat", (req, res) => {
  const message = String(req.body?.message || "").toLowerCase();

  if (message.includes("schedule") || message.includes("add") || message.includes("create")) {
    return res.json({
      reply: "I can create that event, but I still need exact start and end time.",
    });
  }

  return res.json({ reply: defaultReply });
});

export default router;

import express from "express";
import { getAccountAndAccessToken, getRequestedUserEmail } from "../services/googleService.js";

const router = express.Router();

const emailsStore = [
  {
    id: "fallback-1",
    from: "professor@university.edu",
    subject: "Project milestone update",
    preview: "Please share your latest progress by Friday evening.",
    read: false,
    starred: true,
    receivedAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    from: "ta@university.edu",
    subject: "Lab timing confirmation",
    preview: "The lab session has moved to 3:30 PM tomorrow.",
    read: true,
    starred: false,
    receivedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
];

router.get("/", (req, res) => {
  const handler = async () => {
    const userEmail = getRequestedUserEmail(req);
    if (!userEmail) {
      return res.json(emailsStore);
    }
    try {
      const { accessToken } = await getAccountAndAccessToken(userEmail);
      const indexRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const indexData = await indexRes.json();
      if (!indexRes.ok || !Array.isArray(indexData.messages)) {
        return res.json(emailsStore);
      }

      const output = [];
      for (const msg of indexData.messages.slice(0, 25)) {
        const id = String(msg.id || "");
        if (!id) continue;
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const detail = await detailRes.json();
        if (!detailRes.ok) continue;
        const headers = detail.payload?.headers || [];
        const from = headers.find((h) => String(h.name || "").toLowerCase() === "from")?.value || "Unknown";
        const subject = headers.find((h) => String(h.name || "").toLowerCase() === "subject")?.value || "(no subject)";
        const dateRaw = headers.find((h) => String(h.name || "").toLowerCase() === "date")?.value || "";
        const labelIds = new Set(detail.labelIds || []);
        output.push({
          id,
          from,
          subject,
          preview: String(detail.snippet || ""),
          read: !labelIds.has("UNREAD"),
          starred: labelIds.has("STARRED"),
          receivedAt: dateRaw || new Date().toISOString(),
        });
      }
      return res.json(output.length ? output : emailsStore);
    } catch (_err) {
      return res.json(emailsStore);
    }
  };
  handler().catch(() => res.json(emailsStore));
});

router.post("/:message_id/star", (req, res) => {
  const handler = async () => {
  const { message_id: messageId } = req.params;
  const starred = Boolean(req.body?.starred);
  const email = emailsStore.find((item) => item.id === messageId);
  if (email) {
    email.starred = starred;
  }

    const userEmail = getRequestedUserEmail(req);
    if (userEmail) {
      try {
        const { accessToken } = await getAccountAndAccessToken(userEmail);
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            addLabelIds: starred ? ["STARRED"] : [],
            removeLabelIds: starred ? [] : ["STARRED"],
          }),
        });
      } catch (_err) {
        // Keep local update even if remote fails.
      }
    }
  return res.json({ ok: true });
  };
  handler().catch(() => res.json({ ok: true }));
});

router.post("/:message_id/mark-read", (req, res) => {
  const handler = async () => {
  const { message_id: messageId } = req.params;
  const read = Boolean(req.body?.read);
  const email = emailsStore.find((item) => item.id === messageId);
  if (email) {
    email.read = read;
  }

    const userEmail = getRequestedUserEmail(req);
    if (userEmail) {
      try {
        const { accessToken } = await getAccountAndAccessToken(userEmail);
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            addLabelIds: read ? [] : ["UNREAD"],
            removeLabelIds: read ? ["UNREAD"] : [],
          }),
        });
      } catch (_err) {
        // Keep local update even if remote fails.
      }
    }
  return res.json({ ok: true });
  };
  handler().catch(() => res.json({ ok: true }));
});

router.post("/:message_id/draft-reply", async (req, res) => {
  const { message_id: messageId } = req.params;
  const prompt = String(req.body?.prompt || "").trim();

  try {
    if (process.env.OPENAI_API_KEY && prompt) {
      return res.json({ draft: `Draft for ${messageId}: ${prompt}` });
    }
    return res.json({ draft: "Draft: Thanks for the update. I will follow up shortly." });
  } catch (_error) {
    return res.json({ draft: "Draft: Thanks for the update. I will follow up shortly." });
  }
});

export default router;

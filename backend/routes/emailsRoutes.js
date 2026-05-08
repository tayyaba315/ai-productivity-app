import express from "express";
import { getAccountAndAccessToken, getRequestedUserEmail } from "../services/googleService.js";

const router = express.Router();

router.get("/", (req, res) => {
  const handler = async () => {
    const requestedEmail = getRequestedUserEmail(req);
    if (!requestedEmail) {
      return res.status(400).json({
        detail: "Missing logged-in email context",
        connected: false,
        source: "none",
        emails: [],
      });
    }

    try {
      const { accessToken } = await getAccountAndAccessToken(requestedEmail);
      const indexRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const indexData = await indexRes.json();
      if (!indexRes.ok || !Array.isArray(indexData.messages)) {
        return res.status(502).json({
          detail: "Failed to fetch Gmail inbox",
          connected: true,
          source: "gmail",
          emails: [],
        });
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
      return res.json({
        connected: true,
        source: "gmail",
        emails: output,
      });
    } catch (err) {
      return res.status(400).json({
        detail: String(err?.message || "Google account not connected"),
        connected: false,
        source: "none",
        emails: [],
      });
    }
  };
  handler().catch((err) =>
    res.status(500).json({
      detail: String(err?.message || "Unexpected error while fetching emails"),
      connected: false,
      source: "none",
      emails: [],
    })
  );
});

router.post("/:message_id/star", (req, res) => {
  const handler = async () => {
  const { message_id: messageId } = req.params;
  const starred = Boolean(req.body?.starred);
  const requestedEmail = getRequestedUserEmail(req);
  if (!requestedEmail) {
    return res.status(400).json({ detail: "Missing logged-in email context" });
  }

  try {
    const { accessToken } = await getAccountAndAccessToken(requestedEmail);
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        addLabelIds: starred ? ["STARRED"] : [],
        removeLabelIds: starred ? [] : ["STARRED"],
      }),
    });
  } catch (_err) {
    return res.status(400).json({ detail: "Unable to update Gmail star state" });
  }
  return res.json({ ok: true });
  };
  handler().catch(() => res.status(500).json({ detail: "Failed to update star state" }));
});

router.post("/:message_id/mark-read", (req, res) => {
  const handler = async () => {
  const { message_id: messageId } = req.params;
  const read = Boolean(req.body?.read);
  const requestedEmail = getRequestedUserEmail(req);
  if (!requestedEmail) {
    return res.status(400).json({ detail: "Missing logged-in email context" });
  }

  try {
    const { accessToken } = await getAccountAndAccessToken(requestedEmail);
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        addLabelIds: read ? [] : ["UNREAD"],
        removeLabelIds: read ? ["UNREAD"] : [],
      }),
    });
  } catch (_err) {
    return res.status(400).json({ detail: "Unable to update Gmail read state" });
  }
  return res.json({ ok: true });
  };
  handler().catch(() => res.status(500).json({ detail: "Failed to update read state" }));
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

import express from "express";

const router = express.Router();

router.get("/google/connect", (_req, res) => {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  return res.json({ auth_url: `${frontendOrigin}/oauth/google#connect=1` });
});

router.get("/google/callback", (_req, res) => {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const accessToken = "demo-access-token";
  const refreshToken = "demo-refresh-token";
  return res.redirect(`${frontendOrigin}/oauth/google#access_token=${accessToken}&refresh_token=${refreshToken}`);
});

export default router;

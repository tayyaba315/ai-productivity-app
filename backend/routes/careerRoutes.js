import express from "express";

const router = express.Router();

let careerProfile = null;

router.post("/profile", (req, res) => {
  const payload = req.body || {};
  careerProfile = {
    target_role: String(payload.target_role || careerProfile?.target_role || ""),
    skills: String(payload.skills || careerProfile?.skills || ""),
    interests: String(payload.interests || careerProfile?.interests || ""),
    experience_level: String(payload.experience_level || careerProfile?.experience_level || ""),
  };
  return res.json(careerProfile);
});

router.get("/recommendations", (_req, res) => {
  const skill = careerProfile?.skills || "your strengths";
  return res.json({
    recommendations: [`Build projects around ${skill}`, "Apply to 3 internships weekly"],
  });
});

export default router;

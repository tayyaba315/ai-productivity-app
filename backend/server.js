import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import jobsRoutes from "./routes/jobsRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import emailsRoutes from "./routes/emailsRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import integrationsRoutes from "./routes/integrationsRoutes.js";
import tasksRoutes from "./routes/tasksRoutes.js";
import schedulesRoutes from "./routes/schedulesRoutes.js";
import locationsRoutes from "./routes/locationsRoutes.js";
import careerRoutes from "./routes/careerRoutes.js";
import studyRoutes from "./routes/studyRoutes.js";
import authGoogleRoutes from "./routes/authGoogleRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();

// CORS — update FRONTEND_URL after deploying frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

// Cached DB connection for serverless
let isConnected = false;
const initDB = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

app.use(async (req, res, next) => {
  await initDB();
  next();
});

app.get("/", (_req, res) => {
  res.json({ message: "Align AI MERN backend running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/classroom", classroomRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/auth", authGoogleRoutes);
app.use("/api/settings", settingsRoutes);

// Only listen locally, NOT on Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;  // ← Vercel needs this
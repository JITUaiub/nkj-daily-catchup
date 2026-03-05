import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import projectRoutes from "./routes/projects.js";
import timeRoutes from "./routes/time.js";
import followUpRoutes from "./routes/follow-ups.js";
import noteRoutes from "./routes/notes.js";
import meetingRoutes from "./routes/meetings.js";

const app = express();
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});

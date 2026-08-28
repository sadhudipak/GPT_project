import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import chatRoutes from "./routes/chat.js";
import voiceRoutes from "./routes/voice.js";
import authRoutes from "./routes/auth.js";
import optionsRoutes from "./routes/options.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("connection with Database!!");
  } catch (err) {
    console.log("Failed to connect with DB", err);
  }
};

app.use("/api/voice", voiceRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/options", optionsRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", chatRoutes);

const frontendDist = path.join(__dirname, "..", "frontend", "dist");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);

  connectDB();
});

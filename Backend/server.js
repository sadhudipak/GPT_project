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
import cors from "cors";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

const app = express();
const PORT = process.env.PORT || 8080;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("connection with Database!!");
    } catch (err) {
        console.log("Faild to connect with DB", err);
    }
}

// Comma-separated list of allowed origins, e.g.
// CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        // allow non-browser tools (curl, server-to-server, etc.) with no origin
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// More specific routers must be registered before the broad "/api" mount below,
// otherwise chatRoutes (mounted at "/api") intercepts everything under /api/*
// - including /api/auth/* and /api/options - since Express matches by prefix.
app.use("/api/voice", voiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/options", optionsRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api", chatRoutes);

// Optional: serve the built frontend if it's deployed alongside the backend
// (single-service deploy). If frontend/dist doesn't exist, this is a no-op.
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

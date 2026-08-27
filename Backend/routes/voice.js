import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getTranscription, getSpeechBuffer } from "../utils/openai.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Multer stores the uploaded audio file temporarily in "uploads/"
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB cap on voice notes
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") {
            cb(null, true);
        } else {
            cb(new Error("Only audio files are allowed"));
        }
    }
});

router.use(authMiddleware);

// POST /api/voice/transcribe
// Accepts multipart/form-data with a field named "audio"
// Returns: { text: "transcribed string" }
router.post("/voice/transcribe", upload.single("audio"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
    }

    const filePath = path.resolve(req.file.path);

    try {
        const text = await getTranscription(filePath);
        return res.json({ text });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to transcribe audio" });
    } finally {
        // Always clean up the temp file, success or failure
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.log("Failed to delete temp file:", unlinkErr);
        });
    }
});

// POST /api/voice/speak
// Accepts JSON: { text: "..." }
// Returns: raw audio/mpeg stream (playable mp3)
router.post("/voice/speak", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Missing text field" });
    }

    try {
        const audioBuffer = await getSpeechBuffer(text);
        res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.length,
        });
        return res.send(audioBuffer);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to generate speech" });
    }
});

export default router;

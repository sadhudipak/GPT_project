import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getTranscription, getSpeechBuffer } from "../utils/openai.js";

const router = express.Router();

// Multer stores the uploaded audio file temporarily in "uploads/"
// Make sure this folder exists at your project root (mkdir uploads)
const upload = multer({ dest: "uploads/" });

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